import { describe, expect, it, beforeEach } from 'vitest';
import {
  avancarEtapa,
  createCampaign,
  createDomain,
  createICP,
  createPipelineStage,
  deleteCampaign,
  deleteDomain,
  deleteICP,
  getLeadsTestCompanyIds,
  listCampaigns,
  listDomains,
  listICPs,
  listLeads,
  listPipelineStages,
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
      data: {
        lead_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01',
        empresa_nome: expect.stringContaining('TechBR'),
        contato_email: 'rafael@techbr.com.br',
      },
    });
    expect(event.data.historico_interacoes.length).toBeGreaterThan(0);
  });
});
