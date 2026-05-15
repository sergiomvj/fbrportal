import { describe, expect, it, beforeEach } from 'vitest';
import {
  avancarEtapa,
  captureLeadsFromSource,
  createCampaign,
  createDomain,
  createICP,
  createPipelineStage,
  deleteCampaign,
  deleteDomain,
  deleteICP,
  getLeadsTestCompanyIds,
  getSourceRun,
  listCampaigns,
  listDomains,
  listICPs,
  listLeads,
  listPipelineStages,
  listSourceRuns,
  handoffToClick,
  resetLeadsStoreForTests,
  updateCampaign,
  updateDomain,
  updateICP,
  updatePipelineStage,
} from './store';

describe('leads store operations', () => {
  const ids = getLeadsTestCompanyIds();
  const context = { companyId: ids.alpha, userId: ids.user, moduleSource: 'fbr-portal' };

  beforeEach(() => {
    resetLeadsStoreForTests();
  });

  it('creates and updates custom pipeline stages', () => {
    const created = createPipelineStage({ nome: 'Revisao final', descricao: 'Aprovacao manual', cor: 'violet' });
    expect(created.id).toBe('revisao_final');

    const updated = updatePipelineStage(created.id, { nome: 'Revisao comercial', cor: 'teal' });
    expect(updated.nome).toBe('Revisao comercial');
    expect(listPipelineStages().some((stage) => stage.id === created.id && stage.cor === 'teal')).toBe(true);
  });

  it('moves a lead to a newly created stage', () => {
    const stage = createPipelineStage({ nome: 'Pesquisa manual', descricao: 'Etapa extra' });
    const lead = listLeads(context, { page_size: 5 }).items[0];
    expect(lead).toBeDefined();

    const updated = avancarEtapa(context, lead!.id!, stage.id);
    expect(updated.etapa).toBe(stage.id);
  });

  it('supports domain CRUD', () => {
    const created = createDomain(context, {
      dominio: 'novodominio.facebrasil.com.br',
      status: 'aquecendo',
      warming_phase: 'fase1',
      warming_dia: 8,
      bounce_rate: 0.4,
      envios_hoje: 2,
      limite_diario: 10,
      open_rate: 19,
      blacklist: false,
      spf_ok: true,
      dkim_ok: true,
      dmarc_ok: false,
      total_envios_7d: 14,
      total_bounces_7d: 0,
    });

    const updated = updateDomain(context, created.id!, { status: 'atencao', warming_phase: 'fase2' });
    expect(updated.status).toBe('atencao');

    deleteDomain(context, created.id!);
    expect(listDomains(context).some((domain) => domain.id === created.id)).toBe(false);
  });

  it('supports ICP CRUD when there are no linked leads or campaigns', () => {
    const created = createICP(context, {
      nome: 'ICP Teste',
      descricao: 'Segmento validado',
      setor: ['Software'],
      porte: ['Medio'],
      cargo_alvo: ['CEO'],
      regiao: ['SP'],
      score_minimo: 55,
      keywords: ['saas'],
      exclusoes: [],
      dominio_email_permitido: ['todos'],
      ativo: false,
    });

    const updated = updateICP(context, created.id!, { ativo: true, score_minimo: 60 });
    expect(updated.ativo).toBe(true);

    deleteICP(context, created.id!);
    expect(listICPs(context).some((icp) => icp.id === created.id)).toBe(false);
  });

  it('supports campaigns CRUD and MKT linkage fields', () => {
    const firstIcp = createICP(context, {
      nome: 'ICP Campanha',
      descricao: 'ICP valido para campanha',
      setor: ['Software'],
      porte: ['Medio'],
      cargo_alvo: ['CEO'],
      regiao: ['SP'],
      score_minimo: 50,
      keywords: ['growth'],
      exclusoes: [],
      dominio_email_permitido: ['todos'],
      ativo: false,
    });
    const firstDomain = listDomains(context)[0];
    expect(firstIcp).toBeDefined();
    expect(firstDomain).toBeDefined();

    const created = createCampaign(context, {
      nome: 'Campanha teste',
      descricao: 'Outbound com suporte do MKT',
      status: 'rascunho',
      icp_id: firstIcp!.id,
      dominio_id: firstDomain!.id,
      mkt_campaign_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
      mkt_campaign_nome: 'Captacao Leads B2B',
      mkt_responsavel: 'Ana Costa',
      mkt_canal: 'LinkedIn',
      cadencia_config: [{ toque: 1, dia: 0, horario_inicio: '09:00', horario_fim: '11:00' }],
    });

    const updated = updateCampaign(context, created.id!, { status: 'ativa' });
    expect(updated.status).toBe('ativa');
    expect(updated.mkt_campaign_nome).toBe('Captacao Leads B2B');

    deleteCampaign(context, created.id!);
    expect(listCampaigns(context).some((campaign) => campaign.id === created.id)).toBe(false);
  });

  it('builds a lead.qualified event envelope for Click handoff', () => {
    const event = handoffToClick(context, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01');

    expect(event).toMatchObject({
      event: 'lead.qualified',
      module_source: 'fbr-leads',
      data: {
        lead_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01',
        empresa_id: ids.alpha,
        empresa_nome: expect.stringContaining('TechBR'),
        contato_email: 'rafael@techbr.com.br',
        etapa_final: 'sql_entregue',
        cadencia: {
          total_toques: 4,
          toques_enviados: 2,
          dominio_utilizado: 'outreach.facebrasil.com.br',
        },
        deduplicacao: {
          fontes_origem: ['linkedin', 'cnpj_biz'],
        },
        prioridade: 'alta',
      },
    });
    expect(event.timestamp).toEqual(expect.any(String));
    expect(event.data.historico_interacoes.length).toBeGreaterThan(0);
    expect(event.data.historico_interacoes[0]).toMatchObject({
      metadata: { toque_numero: 1 },
    });
  });

  it('captures PRD source records into normalized company-scoped leads', () => {
    const linkedin = captureLeadsFromSource(context, {
      fonte: 'linkedin',
      query: { icp_id: 'linkedin-mkt-sp' },
      records: [{
        linkedin_url: 'https://linkedin.com/in/maria-growth',
        contato_nome: 'Maria Growth',
        cargo: 'CMO',
        empresa_nome: 'Growth One',
        empresa_linkedin_url: 'https://linkedin.com/company/growth-one',
        setor: 'Marketing Digital',
        regiao: 'SP',
        email: 'maria@growthone.com.br',
        tamanho_empresa: '51-200',
        ultima_atividade: '2026-05-01',
        conexoes_comum: 12,
        headline: 'CMO | Growth',
      }],
    });

    const cnpj = captureLeadsFromSource(context, {
      fonte: 'cnpj_biz',
      records: [{
        cnpj: '22.222.222/0001-22',
        razao_social: 'SaaS Brasil Ltda',
        nome_fantasia: 'SaaS Brasil',
        cnae_descricao: 'Desenvolvimento de software',
        porte: 'Medio',
        uf: 'SP',
        municipio: 'Sao Paulo',
        situacao_cadastral: 'Ativa',
        email_cadastral: 'contato@saasbrasil.com.br',
        funcionarios_estimado: 90,
      }],
    });

    const googleMaps = captureLeadsFromSource(context, {
      fonte: 'google_maps',
      records: [{
        place_id: 'ChIJ-growth-maps',
        nome: 'Maps Growth Agency',
        endereco_completo: 'Av. Paulista, Sao Paulo',
        categoria: ['Marketing Agency'],
        avaliacao_media: 4.7,
        total_avaliacoes: 38,
        telefone: '+55 11 99999-0000',
        site: 'https://mapsgrowth.com.br',
      }],
    });

    const site = captureLeadsFromSource(context, {
      fonte: 'site',
      records: [{
        url_site: 'https://contentgrowth.com.br',
        titulo_pagina: 'Content Growth',
        emails_encontrados: ['hello@contentgrowth.com.br'],
        contato_email: 'hello@contentgrowth.com.br',
        empresa_nome: 'Content Growth',
        tecnologias: ['Next.js', 'HubSpot'],
        presenca_blog: true,
        https_ativo: true,
        page_speed_score: 82,
      }],
    });

    expect(linkedin.run).toMatchObject({ fonte: 'linkedin', status: 'done', total_records: 1, leads_created: 1 });
    expect(cnpj.run).toMatchObject({ fonte: 'cnpj_biz', status: 'done', leads_created: 1 });
    expect(googleMaps.run).toMatchObject({ fonte: 'google_maps', status: 'done', leads_created: 1 });
    expect(site.run).toMatchObject({ fonte: 'site', status: 'done', leads_created: 1 });

    const captured = listLeads(context, { busca: 'Growth One', page_size: 5 }).items[0];
    expect(captured).toMatchObject({
      empresa_nome: 'Growth One',
      contato_nome: 'Maria Growth',
      fonte: 'linkedin',
      etapa: 'captado',
      fontes_origem: ['linkedin'],
      hash_deduplicacao: 'email:maria@growthone.com.br',
    });
    expect(listSourceRuns(context)).toHaveLength(4);
    expect(getSourceRun(context, linkedin.run.id!).records[0]).toMatchObject({
      fonte: 'linkedin',
      duplicate_status: 'new',
      source_key: 'linkedin:https://linkedin.com/in/maria-growth',
    });
  });

  it('deduplicates captured records by company and stable source/contact keys', () => {
    const first = captureLeadsFromSource(context, {
      fonte: 'site',
      records: [{
        url_site: 'https://dedupe.example.com',
        empresa_nome: 'Dedupe Example',
        contato_nome: 'Ana Dedupe',
        contato_email: 'ana@dedupe.example.com',
        https_ativo: true,
      }],
    });
    const second = captureLeadsFromSource(context, {
      fonte: 'linkedin',
      records: [{
        linkedin_url: 'https://linkedin.com/in/ana-dedupe',
        empresa_nome: 'Dedupe Example',
        contato_nome: 'Ana Dedupe',
        email: 'ana@dedupe.example.com',
      }],
    });

    expect(first.run).toMatchObject({ leads_created: 1, duplicates: 0 });
    expect(second.run).toMatchObject({ leads_created: 0, duplicates: 1 });
    expect(second.records[0]).toMatchObject({
      duplicate_status: 'duplicate',
      duplicate_of_lead_id: first.leads[0]!.id,
    });
    expect(listLeads(context, { busca: 'Dedupe Example', page_size: 10 }).items).toHaveLength(1);
  });

  it('keeps source runs isolated by company and exposes failed terminal runs', () => {
    const otherContext = {
      companyId: '22222222-2222-4222-8222-222222222222',
      userId: ids.user,
      moduleSource: 'fbr-portal',
    };
    const failed = captureLeadsFromSource(context, {
      fonte: 'google_maps',
      query: { cidade: 'Sao Paulo' },
      fail_reason: 'GOOGLE_MAPS_API_KEY_NOT_CONFIGURED',
    });

    expect(failed.run).toMatchObject({
      status: 'failed',
      error: 'GOOGLE_MAPS_API_KEY_NOT_CONFIGURED',
    });
    expect(listSourceRuns(otherContext)).toHaveLength(0);
    expect(listLeads(otherContext, { page_size: 100 }).items).toHaveLength(0);
  });
});
