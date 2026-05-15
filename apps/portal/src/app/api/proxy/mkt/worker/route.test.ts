import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetClickStoreForTests } from '@/lib/click/store';

const estrategiaId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const empresaId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const userId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

const mocks = vi.hoisted(() => ({
  jobs: [] as Array<Record<string, unknown>>,
  updates: [] as Array<{
    table: string;
    values: Record<string, unknown>;
    column: string;
    value: unknown;
    filters?: Array<{ column: string; value: unknown }>;
  }>,
  inserts: [] as Array<{ table: string; values: Record<string, unknown> }>,
  uploads: [] as Array<{ bucket: string; path: string; bytes: number; contentType?: string }>,
  selects: [] as Array<{
    table: string;
    filters: Array<{ type: 'eq' | 'or'; column?: string; value?: unknown; expression?: string }>;
  }>,
  claimSucceeds: true,
}));

vi.mock('@/lib/supabase-admin', () => ({
  createSupabaseServerClient: () => ({
    from: (table: string) => ({
      select: () => ({
        eq: (column: string, value: unknown) => {
          const filters: Array<{ type: 'eq' | 'or'; column?: string; value?: unknown; expression?: string }> = [
            { type: 'eq', column, value },
          ];
          const query = {
            or: (expression: string) => {
              filters.push({ type: 'or', expression });
              return query;
            },
            order: () => ({
              limit: async () => {
                mocks.selects.push({ table, filters: [...filters] });
                return { data: mocks.jobs, error: null };
              },
            }),
          };
          return query;
        },
      }),
      update: (values: Record<string, unknown>) => {
        const filters: Array<{ column: string; value: unknown }> = [];
        const query = {
          eq: (column: string, value: unknown) => {
            filters.push({ column, value });
            return query;
          },
          select: () => ({
            maybeSingle: async () => {
              mocks.updates.push({
                table,
                values,
                column: filters[0]?.column ?? '',
                value: filters[0]?.value,
                filters: [...filters],
              });
              return {
                data: mocks.claimSucceeds ? { id: filters.find((filter) => filter.column === 'id')?.value } : null,
                error: null,
              };
            },
          }),
          then: (resolve: (value: { data: null; error: null }) => unknown) => {
            mocks.updates.push({
              table,
              values,
              column: filters[0]?.column ?? '',
              value: filters[0]?.value,
              filters: [...filters],
            });
            return Promise.resolve({ data: null, error: null }).then(resolve);
          },
        };
        return query;
      },
      insert: async (values: Record<string, unknown>) => {
        mocks.inserts.push({ table, values });
        return { data: values, error: null };
      },
    }),
    storage: {
      from: (bucket: string) => ({
        upload: async (path: string, buffer: Buffer, options: { contentType?: string }) => {
          mocks.uploads.push({
            bucket,
            path,
            bytes: buffer.length,
            ...(options.contentType ? { contentType: options.contentType } : {}),
          });
          return { data: { path }, error: null };
        },
      }),
    },
  }),
}));

vi.mock('@/lib/mkt/queue', () => ({
  MKT_DEFAULT_JOB_CONFIG: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5_000 },
    removeOnComplete: { age: 86400 },
    removeOnFail: { age: 604800 },
  },
  buildMktNextAttemptAt: (attemptNumber: number, now = Date.parse('2026-05-14T10:00:00.000Z')) =>
    new Date(now + 5_000 * 2 ** (Math.max(attemptNumber, 1) - 1)).toISOString(),
  isMktJobReadyForProcessing: (job: { next_attempt_at?: string | null }) =>
    !job.next_attempt_at || Date.parse(job.next_attempt_at) <= Date.parse('2026-05-14T10:00:00.000Z'),
}));

vi.mock('@/lib/mkt/workers/extrator', () => ({
  processExtraction: vi.fn(),
}));

vi.mock('@/lib/mkt/workers/estrategista', () => ({
  processEstrategia: vi.fn(),
}));

vi.mock('@/lib/mkt/workers/copy', () => ({
  processCopy: vi.fn(),
}));

vi.mock('@/lib/mkt/workers/calendario', () => ({
  processCalendario: vi.fn(),
}));

vi.mock('@/lib/mkt/store', () => ({
  getEstrategia: async () => ({
    id: estrategiaId,
    user_id: userId,
    empresa_id: empresaId,
    nome: 'Estrategia Worker Export',
    nicho: 'SaaS B2B',
    status: 'ativa',
    doc_path: 'uploads/empresa/doc.pdf',
    versao: 2,
  }),
  listVersoes: async () => [
    {
      estrategia_id: estrategiaId,
      versao: 2,
      gerado_por: 'estrategista_bot',
      conteudo: {
        posicionamento: {
          brand_archetype: 'Sage',
          tom_de_voz: 'Consultivo',
          uvp: 'Crescimento previsivel',
          posicionamento_mercado: 'Plataforma consultiva para B2B.',
        },
        mix_canais: [{ nome: 'linkedin', percentual_alocacao: 60, justificativa: 'Canal principal.' }],
        kpis: [{ canal: 'linkedin', cac: 'R$ 420', ltv: 'R$ 8.000', roi: '3.2x' }],
        campanhas: [
          {
            nome: 'Diagnostico Executivo',
            objetivo_smart: 'Gerar 40 SQLs em 30 dias.',
            mensagens_chave: ['Reducao de CAC'],
            budget: 'R$ 12.000',
            timeline: '30 dias',
            formatos: ['ebook'],
            audiencias_segmentadas: ['Diretores comerciais'],
            canal: 'linkedin',
            prioridade: 1,
          },
        ],
      },
    },
  ],
  getDiagnosticoByEstrategia: async () => ({
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
    uvp: 'Crescimento previsivel',
    score_viab: 82,
    justificativa: 'Mercado com demanda ativa.',
    aprovado: true,
  }),
  listCopyByEstrategia: async () => [
    {
      estrategia_id: estrategiaId,
      versao: 2,
      campanha_nome: 'Diagnostico Executivo',
      tipo: 'headline',
      canal: 'linkedin',
      conteudo: 'Transforme autoridade em pipeline previsivel.',
    },
  ],
  listLeadMagnetsByEstrategia: async () => [],
  listCalendarByEstrategia: async () => [
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
  listRoadmapByEstrategia: async () => [
    {
      estrategia_id: estrategiaId,
      versao: 2,
      fase: '0-30d',
      item: 'Publicar diagnostico executivo',
      responsavel: 'Marketing',
      ferramenta: 'LinkedIn',
      status: 'pendente',
    },
  ],
  getBranding: async () => ({
    empresa_id: empresaId,
    cor_primaria: '#0EA5E9',
    cor_secundaria: '#8B5CF6',
    fonte_principal: 'Inter',
    nome_empresa: 'Facebrasil',
  }),
}));

describe('MKT worker export bridge contract', () => {
  beforeEach(() => {
    resetClickStoreForTests();
    mocks.jobs = [
      {
        id: 'job-export-1',
        empresa_id: empresaId,
        estrategia_id: estrategiaId,
        categoria: 'export',
        status: 'pending',
        tentativas: 0,
        max_tentativas: 3,
        next_attempt_at: '2026-05-14T09:59:55.000Z',
        payload: {
          export_id: 'export-1',
          file_path: `exports/${empresaId}/${estrategiaId}/v2.pdf`,
          formato: 'pdf',
          exportado_por: userId,
        },
      },
    ];
    mocks.updates = [];
    mocks.inserts = [];
    mocks.uploads = [];
    mocks.selects = [];
    mocks.claimSucceeds = true;
    delete process.env.MKT_CLICK_BRIDGE_URL;
    process.env.CRON_SECRET = 'test-secret';
  });

  afterEach(() => {
    delete process.env.CRON_SECRET;
    vi.restoreAllMocks();
  });

  it('processes a real export job and emits strategy.exported to Click instead of skipping the bridge', async () => {
    const expectedEndpoint = 'http://localhost/api/proxy/click/events';
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input instanceof Request ? input.url : String(input);
      if (url !== expectedEndpoint) {
        throw new Error(`Unexpected bridge endpoint: ${url}`);
      }

      const { POST } = await import('@/app/api/proxy/click/events/route');
      return POST(new Request(url, init));
    });

    const worker = await import('./route');
    const response = await worker.POST(
      new Request('http://localhost/api/proxy/mkt/worker', {
        method: 'POST',
        headers: { authorization: 'Bearer test-secret' },
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ processed: 1, ids: ['job-export-1'] });
    expect(fetchSpy).toHaveBeenCalledWith(
      expectedEndpoint,
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"event":"strategy.exported"'),
      }),
    );
    expect(mocks.uploads).toEqual([
      expect.objectContaining({
        bucket: 'mkt',
        path: `exports/${empresaId}/${estrategiaId}/v2.pdf`,
        contentType: 'application/pdf',
      }),
    ]);
    expect(mocks.updates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          table: 'mkt_processing_jobs',
          values: expect.objectContaining({ status: 'processing', tentativas: 1 }),
          filters: expect.arrayContaining([
            { column: 'id', value: 'job-export-1' },
            { column: 'status', value: 'pending' },
          ]),
        }),
        expect.objectContaining({
          table: 'mkt_processing_jobs',
          values: expect.objectContaining({ status: 'done', updated_at: expect.any(String) }),
        }),
        expect.objectContaining({ table: 'mkt_exports', values: expect.objectContaining({ status: 'done' }) }),
      ]),
    );

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
    const auditBody = await auditResponse.json();

    expect(auditBody.audit).toEqual(
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

  it('keeps a completed export observable and enqueues Click delivery retry when the bridge is unavailable', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('click unavailable', { status: 503 }));

    const worker = await import('./route');
    const response = await worker.POST(
      new Request('http://localhost/api/proxy/mkt/worker', {
        method: 'POST',
        headers: { authorization: 'Bearer test-secret' },
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ processed: 1, ids: ['job-export-1'] });
    expect(mocks.updates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          table: 'mkt_processing_jobs',
          values: expect.objectContaining({ status: 'done', updated_at: expect.any(String) }),
        }),
        expect.objectContaining({ table: 'mkt_exports', values: expect.objectContaining({ status: 'done' }) }),
      ]),
    );
    expect(mocks.inserts).toEqual([
      expect.objectContaining({
        table: 'mkt_processing_jobs',
        values: expect.objectContaining({
          categoria: 'fbr_click_delivery',
          status: 'pending',
          max_tentativas: 3,
          next_attempt_at: '2026-05-14T10:00:05.000Z',
          payload: expect.objectContaining({
            export_id: 'export-1',
            previous_error: 'click unavailable',
            event: expect.objectContaining({ event: 'strategy.exported' }),
          }),
        }),
      }),
    ]);
  });

  it('skips a pending row when the persistent processing claim was already taken', async () => {
    mocks.claimSucceeds = false;
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const worker = await import('./route');
    const response = await worker.POST(
      new Request('http://localhost/api/proxy/mkt/worker', {
        method: 'POST',
        headers: { authorization: 'Bearer test-secret' },
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ processed: 0, ids: [] });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(mocks.uploads).toEqual([]);
    expect(mocks.updates).toEqual([
      expect.objectContaining({
        table: 'mkt_processing_jobs',
        values: expect.objectContaining({ status: 'processing', tentativas: 1 }),
        filters: expect.arrayContaining([
          { column: 'id', value: 'job-export-1' },
          { column: 'status', value: 'pending' },
        ]),
      }),
    ]);
  });

  it('does not claim pending jobs before their persisted backoff window opens', async () => {
    mocks.jobs[0] = {
      ...mocks.jobs[0],
      next_attempt_at: '2026-05-14T10:00:05.000Z',
    };
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const worker = await import('./route');
    const response = await worker.POST(
      new Request('http://localhost/api/proxy/mkt/worker', {
        method: 'POST',
        headers: { authorization: 'Bearer test-secret' },
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ processed: 0, ids: [] });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(mocks.uploads).toEqual([]);
    expect(mocks.updates).toEqual([]);
    expect(mocks.selects).toEqual([
      expect.objectContaining({
        table: 'mkt_processing_jobs',
        filters: expect.arrayContaining([
          { type: 'eq', column: 'status', value: 'pending' },
          expect.objectContaining({
            type: 'or',
            expression: expect.stringMatching(/^next_attempt_at\.is\.null,next_attempt_at\.lte\./),
          }),
        ]),
      }),
    ]);
  });
});
