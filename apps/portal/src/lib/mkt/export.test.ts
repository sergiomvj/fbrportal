import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetClickStoreForTests } from '@/lib/click/store';
import { buildExportPath, bucketForStoragePath, MKT_STORAGE_BUCKETS } from './storage';
import {
  buildStrategyExportedEvent,
  emitStrategyExportedEvent,
  generateMktPdfBuffer,
  generateMktPptxBuffer,
  resolveClickBridgeEndpoint,
  type MktExportBundle,
} from './export';

const estrategiaId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const empresaId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const userId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

function bundle(): MktExportBundle {
  return {
    estrategia: {
      id: estrategiaId,
      user_id: userId,
      empresa_id: empresaId,
      nome: 'Estrategia Exportada',
      nicho: 'SaaS B2B',
      status: 'ativa',
      doc_path: 'uploads/empresa/doc.pdf',
      versao: 2,
    },
    versao: {
      estrategia_id: estrategiaId,
      versao: 2,
      gerado_por: 'estrategista_bot',
      conteudo: {
        posicionamento: {
          brand_archetype: 'Sage',
          tom_de_voz: 'Consultivo',
          uvp: 'Crescimento previsivel com estrategia de conteudo',
          posicionamento_mercado: 'Plataforma consultiva para times B2B.',
        },
        mix_canais: [
          { nome: 'linkedin', percentual_alocacao: 45, justificativa: 'Canal principal da persona.' },
          { nome: 'google_ads', percentual_alocacao: 30, justificativa: 'Captura demanda ativa.' },
        ],
        kpis: [{ canal: 'linkedin', cac: 'R$ 420', ltv: 'R$ 8.000', roi: '3.2x' }],
        campanhas: [
          {
            nome: 'Diagnostico Executivo',
            objetivo_smart: 'Gerar 40 SQLs em 30 dias.',
            mensagens_chave: ['Reducao de CAC'],
            budget: 'R$ 12.000',
            timeline: '30 dias',
            formatos: ['ebook', 'webinar'],
            audiencias_segmentadas: ['Diretores comerciais'],
            canal: 'linkedin',
            prioridade: 1,
          },
        ],
      },
    },
    diagnostico: {
      estrategia_id: estrategiaId,
      swot: {
        forcas: ['Autoridade'],
        fraquezas: ['Baixa cadencia'],
        oportunidades: ['Demanda ativa'],
        ameacas: ['Concorrencia'],
      },
      persona: {
        nome: 'Diretor Comercial',
        idade: '35-50',
        profissao: 'Executivo',
        dores: ['Pipeline instavel'],
        desejos: ['Previsibilidade'],
        comportamento_digital: 'Pesquisa benchmarks no LinkedIn',
        canais_preferidos: ['linkedin'],
      },
      uvp: 'Crescimento previsivel com estrategia de conteudo',
      score_viab: 82,
      justificativa: 'Mercado com demanda ativa.',
      aprovado: true,
    },
    copy: [
      {
        estrategia_id: estrategiaId,
        versao: 2,
        campanha_nome: 'Diagnostico Executivo',
        tipo: 'headline',
        canal: 'linkedin',
        conteudo: 'Transforme autoridade em pipeline previsivel.',
      },
    ],
    leadMagnets: [
      {
        estrategia_id: estrategiaId,
        versao: 2,
        nome: 'Checklist de Pipeline',
        persona_alvo: 'Diretor Comercial',
        funil_estagio: 'topo',
        landing_page: {
          hero: 'Diagnostique seu pipeline',
          beneficios: ['Clareza', 'Priorizacao'],
          social_proof: 'Usado por times B2B.',
          cta: 'Baixar checklist',
        },
        nurture_emails: [
          { assunto: 'Diagnostico', corpo: 'Primeiro passo.', dia_envio: 1 },
          { assunto: 'Prioridades', corpo: 'Segundo passo.', dia_envio: 3 },
          { assunto: 'Execucao', corpo: 'Terceiro passo.', dia_envio: 5 },
          { assunto: 'Metricas', corpo: 'Quarto passo.', dia_envio: 7 },
          { assunto: 'Proposta', corpo: 'Quinto passo.', dia_envio: 10 },
        ],
      },
    ],
    calendario: [
      {
        estrategia_id: estrategiaId,
        versao: 2,
        data: '2026-05-14',
        canal: 'linkedin',
        tipo: 'organico',
        tema: 'Quick win de autoridade',
        copy_resumo: 'Post educativo',
        status: 'pendente',
        is_quick_win: true,
      },
    ],
    roadmap: [
      {
        estrategia_id: estrategiaId,
        versao: 2,
        fase: '0-30d',
        item: 'Publicar diagnostico executivo',
        responsavel: 'Marketing',
        ferramenta: 'LinkedIn',
        status: 'pendente',
        alerta_prazo: '2026-05-20',
      },
    ],
    branding: {
      empresa_id: empresaId,
      cor_primaria: '#0EA5E9',
      cor_secundaria: '#8B5CF6',
      fonte_principal: 'Inter',
      nome_empresa: 'Facebrasil',
    },
  };
}

describe('MKT export contracts', () => {
  afterEach(() => {
    delete process.env.MKT_CLICK_BRIDGE_URL;
    vi.restoreAllMocks();
  });

  it('uses the PRD-aligned MKT bucket and versioned export path', () => {
    const path = buildExportPath(empresaId, estrategiaId, 'pdf', 2);

    expect(MKT_STORAGE_BUCKETS).toEqual({ uploads: 'mkt', exports: 'mkt' });
    expect(path).toBe(`exports/${empresaId}/${estrategiaId}/v2.pdf`);
    expect(bucketForStoragePath(path)).toBe('mkt');
  });

  it('generates binary PDF and PPTX payloads without simulated content', async () => {
    const pdf = await generateMktPdfBuffer(bundle());
    const pptx = generateMktPptxBuffer(bundle());

    expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
    expect(pptx.subarray(0, 2).toString()).toBe('PK');
    expect(pptx.toString('utf8')).toContain('Estrategia Exportada');
    expect(pptx.toString('utf8')).not.toContain('Simulated');
  });

  it('builds the documented strategy.exported payload for Click', () => {
    const event = buildStrategyExportedEvent(bundle(), userId);

    expect(event).toEqual({
      event: 'strategy.exported',
      data: {
        estrategia_id: estrategiaId,
        nome: 'Estrategia Exportada',
        nicho: 'SaaS B2B',
        documento_original: 'uploads/empresa/doc.pdf',
        score_viabilidade: 82,
        canais_sugeridos: ['linkedin', 'google_ads'],
        exportado_por: userId,
      },
    });
  });

  it('delivers strategy.exported to the configured Click proxy instead of skipping the bridge', async () => {
    resetClickStoreForTests();
    const endpoint = 'http://localhost/api/proxy/click/events';
    process.env.MKT_CLICK_BRIDGE_URL = endpoint;

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input instanceof Request ? input.url : String(input);
      if (url !== endpoint) {
        throw new Error(`Unexpected bridge endpoint: ${url}`);
      }

      const { POST } = await import('@/app/api/proxy/click/events/route');
      const requestInit: RequestInit = {};
      if (init?.method) requestInit.method = init.method;
      if (init?.headers) requestInit.headers = init.headers;
      if (init && 'body' in init) requestInit.body = init.body ?? null;

      return POST(
        new Request(url, requestInit),
      );
    });

    const result = await emitStrategyExportedEvent(
      buildStrategyExportedEvent(bundle(), userId),
      { userId, companyId: empresaId, moduleSource: 'fbr-mkt' },
    );

    expect(result).toEqual({ status: 'sent', statusCode: 202 });

    const audit = await import('@/app/api/proxy/click/audit/route');
    const auditResponse = await audit.GET(
      new Request(`http://localhost/api/proxy/click/audit?deal_id=${estrategiaId}`, {
        headers: {
          'x-user-id': userId,
          'x-user-role': 'admin',
          'x-workspace-id': empresaId,
        },
      }),
    );
    const body = await auditResponse.json();

    expect(body.audit).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          dealId: estrategiaId,
          type: 'cross_module_event',
          metadata: expect.objectContaining({
            event: 'strategy.exported',
            moduleSource: 'fbr-mkt',
            exportadoPor: userId,
          }),
        }),
      ]),
    );
  });

  it('derives the Click bridge endpoint from the app base URL when no explicit bridge URL is provided', () => {
    expect(resolveClickBridgeEndpoint(undefined, 'http://localhost:3000')).toBe('http://localhost:3000/api/proxy/click/events');
    expect(resolveClickBridgeEndpoint(undefined, 'portal.facebrasil.com')).toBe('https://portal.facebrasil.com/api/proxy/click/events');
  });
});
