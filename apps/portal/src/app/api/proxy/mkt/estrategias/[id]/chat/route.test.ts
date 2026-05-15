import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  MktCalendarItem,
  MktChatMessage,
  MktCopyVariant,
  MktDiagnostico,
  MktEstrategia,
  MktEstrategiaVersao,
  MktLeadMagnet,
  MktRoadmapTask,
} from '@/lib/mkt/types';

type StreamTextOptions = {
  onFinish?: (result: { text: string }) => unknown | Promise<unknown>;
};

const mockState = vi.hoisted(() => {
  const estrategiaId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const companyId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const userId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

  return {
    estrategiaId,
    companyId,
    userId,
    savedMessages: [] as MktChatMessage[],
    cachedContext: null as { estrategia_id: string; empresa_id: string; payload: unknown; expires_at: string } | null,
    getMktRequestContext: vi.fn(async (request: Request) => {
      const requestUser = request.headers.get('x-user-id');
      const requestCompany = request.headers.get('x-company-id') ?? request.headers.get('x-workspace-id');

      if (!requestUser || !requestCompany) {
        return Response.json({ code: 'UNAUTHORIZED_CONTEXT' }, { status: 401 });
      }

      return {
        companyId: requestCompany,
        userId: requestUser,
        moduleSource: request.headers.get('x-module-source') ?? 'fbr-portal',
      };
    }),
  };
});

const fixtures = vi.hoisted(() => {
  const estrategia: MktEstrategia = {
    id: mockState.estrategiaId,
    user_id: mockState.userId,
    empresa_id: mockState.companyId,
    nome: 'Estrategia API Contextual',
    nicho: 'SaaS B2B',
    status: 'ativa',
    doc_path: 'uploads/empresa/viabilidade.pdf',
    versao: 2,
  };

  const diagnostico: MktDiagnostico = {
    estrategia_id: mockState.estrategiaId,
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
  };

  const versao: MktEstrategiaVersao = {
    estrategia_id: mockState.estrategiaId,
    versao: 2,
    gerado_por: 'estrategista_bot',
    conteudo: {
      posicionamento: {
        brand_archetype: 'Sage',
        tom_de_voz: 'Consultivo',
        uvp: 'Crescimento previsivel',
        posicionamento_mercado: 'Plataforma consultiva para B2B.',
      },
      mix_canais: [
        { nome: 'linkedin', percentual_alocacao: 50, justificativa: 'Persona ativa.' },
        { nome: 'google_ads', percentual_alocacao: 30, justificativa: 'Captura demanda ativa.' },
      ],
      kpis: [{ canal: 'linkedin', cac: 'R$ 420', roi: '3.2x' }],
      campanhas: [
        {
          nome: 'Diagnostico Executivo',
          objetivo_smart: 'Gerar 40 SQLs em 30 dias.',
          mensagens_chave: ['Reduzir CAC'],
          budget: 'R$ 12.000',
          timeline: '30 dias',
          formatos: ['ebook'],
          audiencias_segmentadas: ['Diretores comerciais'],
          canal: 'linkedin',
          prioridade: 1,
        },
      ],
    },
  };

  const copy: MktCopyVariant[] = [
    {
      estrategia_id: mockState.estrategiaId,
      versao: 2,
      campanha_nome: 'Diagnostico Executivo',
      tipo: 'headline',
      canal: 'linkedin',
      conteudo: 'Transforme autoridade em pipeline.',
    },
  ];

  const leadMagnets: MktLeadMagnet[] = [
    {
      estrategia_id: mockState.estrategiaId,
      versao: 2,
      nome: 'Checklist de Pipeline',
      persona_alvo: 'Diretor Comercial',
      funil_estagio: 'topo',
      landing_page: {
        hero: 'Diagnostique seu pipeline',
        beneficios: ['Clareza'],
        social_proof: 'Usado por B2B.',
        cta: 'Baixar checklist',
      },
      nurture_emails: [
        { assunto: 'Diagnostico', corpo: 'Passo um.', dia_envio: 1 },
        { assunto: 'Prioridades', corpo: 'Passo dois.', dia_envio: 3 },
        { assunto: 'Execucao', corpo: 'Passo tres.', dia_envio: 5 },
        { assunto: 'Metricas', corpo: 'Passo quatro.', dia_envio: 7 },
        { assunto: 'Proposta', corpo: 'Passo cinco.', dia_envio: 10 },
      ],
    },
  ];

  const calendario: MktCalendarItem[] = [
    {
      estrategia_id: mockState.estrategiaId,
      versao: 2,
      data: '2026-05-14',
      canal: 'linkedin',
      tipo: 'organico',
      tema: 'Quick win de autoridade',
      copy_resumo: 'Post educativo',
      status: 'pendente',
      is_quick_win: true,
    },
  ];

  const roadmap: MktRoadmapTask[] = [
    {
      estrategia_id: mockState.estrategiaId,
      versao: 2,
      fase: '0-30d',
      item: 'Publicar diagnostico executivo',
      responsavel: 'Marketing',
      ferramenta: 'LinkedIn',
      status: 'pendente',
      alerta_prazo: '2026-05-20',
    },
  ];

  return { estrategia, diagnostico, versao, copy, leadMagnets, calendario, roadmap };
});

const llmMocks = vi.hoisted(() => {
  const state = {
    text: 'Resposta LLM sem textStream com Contexto operacional considerado, calendario e roadmap.',
  };

  return {
    state,
    streamText: vi.fn((options: StreamTextOptions) => {
      void options.onFinish?.({ text: state.text });

      return {
        toTextStreamResponse: () => new Response(new ReadableStream<Uint8Array>({
          start(controller) {
            const encoder = new TextEncoder();
            controller.enqueue(encoder.encode(state.text));
            controller.close();
          },
        })),
      };
    }),
  };
});

vi.mock('@/lib/mkt/context', () => ({
  getMktRequestContext: mockState.getMktRequestContext,
}));

vi.mock('@/lib/mkt/security', () => ({
  MKT_RATE_LIMITS: { chat: { windowMs: 60_000, maxRequests: 10 } },
  checkPersistentRateLimit: vi.fn(async () => ({ allowed: true, remaining: 19, resetAt: Date.now() + 60_000 })),
  rateLimitHeaders: vi.fn(() => ({ 'x-ratelimit-remaining': '19' })),
  rateLimitResponse: vi.fn(() => Response.json({ code: 'RATE_LIMITED' }, { status: 429 })),
  withSecurityHeaders: vi.fn((response: Response) => {
    response.headers.set('x-content-type-options', 'nosniff');
    return response;
  }),
}));

vi.mock('@/lib/mkt/queue', () => ({
  enqueueJob: vi.fn(async (category: string, estrategiaId: string, empresaId: string, payload: Record<string, unknown>) => ({
    id: crypto.randomUUID(),
    category,
    estrategiaId,
    empresaId,
    payload,
    status: 'pending',
  })),
}));

vi.mock('@/lib/mkt/store', () => {
  class MktValidationError extends Error {
    constructor(
      message: string,
      readonly status: 400 | 409 | 422,
      readonly issues?: unknown,
    ) {
      super(message);
    }
  }

  return {
    MktValidationError,
    getEstrategia: vi.fn(async () => fixtures.estrategia),
    getDiagnosticoByEstrategia: vi.fn(async () => fixtures.diagnostico),
    getMktChatContextCache: vi.fn(async () => mockState.cachedContext),
    listVersoes: vi.fn(async () => [fixtures.versao]),
    listCopyByEstrategia: vi.fn(async () => fixtures.copy),
    listLeadMagnetsByEstrategia: vi.fn(async () => fixtures.leadMagnets),
    listCalendarByEstrategia: vi.fn(async () => fixtures.calendario),
    listRoadmapByEstrategia: vi.fn(async () => fixtures.roadmap),
    listChatByEstrategia: vi.fn(async (_id: string, _context: unknown, options: number | { limit?: number; before?: string } = 50) => {
      const limit: number = typeof options === 'number' ? options : (options.limit ?? 50);
      const before = typeof options === 'number' ? undefined : options.before;
      const filtered = before
        ? mockState.savedMessages.filter((message) => Date.parse(message.created_at ?? '') < Date.parse(before))
        : mockState.savedMessages;

      return filtered
        .sort((left, right) => Date.parse(left.created_at ?? '') - Date.parse(right.created_at ?? ''))
        .slice(Math.max(filtered.length - limit, 0));
    }),
    saveChatMessage: vi.fn(async (message: Omit<MktChatMessage, 'id' | 'created_at'>) => {
      const saved = {
        ...message,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      };
      mockState.savedMessages.push(saved);
      return saved;
    }),
    saveMktChatContextCache: vi.fn(async (estrategiaId: string, context: { companyId: string }, payload: unknown, ttlMs: number) => {
      const saved = {
        estrategia_id: estrategiaId,
        empresa_id: context.companyId,
        payload,
        expires_at: new Date(Date.now() + ttlMs).toISOString(),
      };
      mockState.cachedContext = saved;
      return saved;
    }),
  };
});

vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: vi.fn(() => vi.fn((model: string) => ({ model }))),
}));

vi.mock('ai', () => ({
  streamText: llmMocks.streamText,
}));

import { GET, POST } from './route';
import { enqueueJob } from '@/lib/mkt/queue';
import { checkPersistentRateLimit } from '@/lib/mkt/security';
import {
  getMktChatContextCache,
  listCalendarByEstrategia,
  listCopyByEstrategia,
  listLeadMagnetsByEstrategia,
  listRoadmapByEstrategia,
  listVersoes,
  saveMktChatContextCache,
} from '@/lib/mkt/store';

function request(init: RequestInit = {}) {
  return new Request(`http://localhost/api/proxy/mkt/estrategias/${mockState.estrategiaId}/chat`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      'x-user-id': mockState.userId,
      'x-company-id': mockState.companyId,
      ...init.headers,
    },
  });
}

async function readStream(response: Response) {
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let output = '';

  if (!reader) return output;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    output += decoder.decode(value, { stream: true });
  }

  return output;
}

function collectSseDeltas(stream: string) {
  return stream
    .split('\n\n')
    .map((event) => {
      const eventType = event.split('\n').find((line) => line.startsWith('event: '))?.slice(7);
      const dataLine = event.split('\n').find((line) => line.startsWith('data: '));
      if (eventType !== 'delta' || !dataLine) return '';
      return (JSON.parse(dataLine.slice(6)) as { delta?: string }).delta ?? '';
    })
    .join('');
}

function collectSseDeltaPayloads(stream: string) {
  return stream
    .split('\n\n')
    .map((event) => {
      const eventType = event.split('\n').find((line) => line.startsWith('event: '))?.slice(7);
      const dataLine = event.split('\n').find((line) => line.startsWith('data: '));
      if (eventType !== 'delta' || !dataLine) return '';
      return (JSON.parse(dataLine.slice(6)) as { delta?: string }).delta ?? '';
    })
    .filter(Boolean);
}

describe('MKT chat route contract', () => {
  beforeEach(() => {
    mockState.savedMessages.length = 0;
    mockState.cachedContext = null;
    llmMocks.streamText.mockClear();
    vi.mocked(enqueueJob).mockClear();
    vi.mocked(getMktChatContextCache).mockClear();
    vi.mocked(saveMktChatContextCache).mockClear();
    vi.mocked(listVersoes).mockClear();
    vi.mocked(listCopyByEstrategia).mockClear();
    vi.mocked(listLeadMagnetsByEstrategia).mockClear();
    vi.mocked(listCalendarByEstrategia).mockClear();
    vi.mocked(listRoadmapByEstrategia).mockClear();
    delete process.env.ZAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
  });

  it('returns persisted history with contextual suggestions and inconsistency flags', async () => {
    mockState.savedMessages.push({
      id: crypto.randomUUID(),
      estrategia_id: mockState.estrategiaId,
      role: 'assistant',
      conteudo: 'Redistribua budget protegendo o quick win.',
      created_at: '2026-05-13T10:00:20.000Z',
    });
    mockState.savedMessages.push({
      id: crypto.randomUUID(),
      estrategia_id: mockState.estrategiaId,
      role: 'user',
      conteudo: 'Como ajusto budget?',
      created_at: '2026-05-13T10:00:00.000Z',
    });

    const response = await GET(request(), { params: Promise.resolve({ id: mockState.estrategiaId }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.messages.map((message: MktChatMessage) => message.conteudo)).toEqual([
      'Como ajusto budget?',
      'Redistribua budget protegendo o quick win.',
    ]);
    expect(body.suggestions).toEqual(expect.arrayContaining([
      expect.stringContaining('Diagnostico Executivo'),
      expect.stringContaining('Quick win de autoridade'),
      expect.stringContaining('Publicar diagnostico executivo'),
    ]));
    expect(body.inconsistencyFlags).toEqual(['canais da estrategia sem calendario: google_ads']);
    expect(body.pagination).toEqual({
      limit: 50,
      returned: 2,
      before: null,
      nextBefore: null,
      hasMore: false,
    });
  });

  it('returns older chat history pages using a created_at cursor', async () => {
    mockState.savedMessages.push(
      ...Array.from({ length: 4 }, (_, index) => ({
        id: crypto.randomUUID(),
        estrategia_id: mockState.estrategiaId,
        role: index % 2 === 0 ? ('user' as const) : ('assistant' as const),
        conteudo: `Mensagem historica ${index + 1}`,
        created_at: new Date(Date.UTC(2026, 4, 14, 10, index, 0)).toISOString(),
      })),
    );

    const response = await GET(
      new Request(`http://localhost/api/proxy/mkt/estrategias/${mockState.estrategiaId}/chat?limit=2`, {
        headers: {
          'x-user-id': mockState.userId,
          'x-company-id': mockState.companyId,
        },
      }),
      { params: Promise.resolve({ id: mockState.estrategiaId }) },
    );
    const firstPage = await response.json();
    const nextBefore = firstPage.pagination.nextBefore as string;
    const olderResponse = await GET(
      new Request(
        `http://localhost/api/proxy/mkt/estrategias/${mockState.estrategiaId}/chat?limit=2&before=${encodeURIComponent(nextBefore)}`,
        {
          headers: {
            'x-user-id': mockState.userId,
            'x-company-id': mockState.companyId,
          },
        },
      ),
      { params: Promise.resolve({ id: mockState.estrategiaId }) },
    );
    const olderPage = await olderResponse.json();

    expect(olderResponse.status).toBe(200);
    expect(firstPage.messages.map((message: MktChatMessage) => message.conteudo)).toEqual([
      'Mensagem historica 3',
      'Mensagem historica 4',
    ]);
    expect(firstPage.pagination).toEqual({
      limit: 2,
      returned: 2,
      before: null,
      nextBefore,
      hasMore: true,
    });
    expect(olderPage.messages.map((message: MktChatMessage) => message.conteudo)).toEqual([
      'Mensagem historica 1',
      'Mensagem historica 2',
    ]);
    expect(olderPage.pagination).toEqual({
      limit: 2,
      returned: 2,
      before: nextBefore,
      nextBefore: null,
      hasMore: false,
    });
  });

  it('persists and reuses the 30-minute operational context cache while keeping chat history fresh', async () => {
    mockState.savedMessages.push({
      id: crypto.randomUUID(),
      estrategia_id: mockState.estrategiaId,
      role: 'user',
      conteudo: 'Primeira pergunta contextual.',
      created_at: '2026-05-14T10:00:00.000Z',
    });

    const firstResponse = await GET(request(), { params: Promise.resolve({ id: mockState.estrategiaId }) });
    expect(firstResponse.status).toBe(200);
    expect(saveMktChatContextCache).toHaveBeenCalledWith(
      mockState.estrategiaId,
      expect.objectContaining({ companyId: mockState.companyId }),
      expect.objectContaining({
        estrategia: fixtures.estrategia,
        diagnostico: fixtures.diagnostico,
        versao: fixtures.versao,
        copy: fixtures.copy,
        calendario: fixtures.calendario,
        roadmap: fixtures.roadmap,
      }),
      30 * 60 * 1000,
    );

    vi.mocked(listVersoes).mockClear();
    vi.mocked(listCopyByEstrategia).mockClear();
    vi.mocked(listLeadMagnetsByEstrategia).mockClear();
    vi.mocked(listCalendarByEstrategia).mockClear();
    vi.mocked(listRoadmapByEstrategia).mockClear();
    vi.mocked(saveMktChatContextCache).mockClear();
    mockState.savedMessages.push({
      id: crypto.randomUUID(),
      estrategia_id: mockState.estrategiaId,
      role: 'assistant',
      conteudo: 'Segunda resposta persistida.',
      created_at: '2026-05-14T10:00:10.000Z',
    });

    const secondResponse = await GET(request(), { params: Promise.resolve({ id: mockState.estrategiaId }) });
    const body = await secondResponse.json();

    expect(secondResponse.status).toBe(200);
    expect(getMktChatContextCache).toHaveBeenCalledTimes(2);
    expect(listVersoes).not.toHaveBeenCalled();
    expect(listCopyByEstrategia).not.toHaveBeenCalled();
    expect(listLeadMagnetsByEstrategia).not.toHaveBeenCalled();
    expect(listCalendarByEstrategia).not.toHaveBeenCalled();
    expect(listRoadmapByEstrategia).not.toHaveBeenCalled();
    expect(saveMktChatContextCache).not.toHaveBeenCalled();
    expect(body.messages.map((message: MktChatMessage) => message.conteudo)).toEqual([
      'Primeira pergunta contextual.',
      'Segunda resposta persistida.',
    ]);
    expect(body.suggestions).toEqual(expect.arrayContaining([
      expect.stringContaining('Quick win de autoridade'),
    ]));
  });

  it('refreshes the operational context cache when the active strategy version changed', async () => {
    mockState.cachedContext = {
      estrategia_id: mockState.estrategiaId,
      empresa_id: mockState.companyId,
      payload: {
        estrategia: {
          ...fixtures.estrategia,
          versao: 1,
          nome: 'Estrategia API Contextual antiga',
        },
        diagnostico: fixtures.diagnostico,
        versao: {
          ...fixtures.versao,
          versao: 1,
          conteudo: {
            ...fixtures.versao.conteudo,
            campanhas: [
              {
                ...fixtures.versao.conteudo.campanhas[0],
                nome: 'Campanha antiga do cache',
              },
            ],
          },
        },
        copy: [],
        leadMagnets: [],
        calendario: [],
        roadmap: [],
      },
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    };

    const response = await GET(request(), { params: Promise.resolve({ id: mockState.estrategiaId }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(listVersoes).toHaveBeenCalledOnce();
    expect(listCopyByEstrategia).toHaveBeenCalledOnce();
    expect(listLeadMagnetsByEstrategia).toHaveBeenCalledOnce();
    expect(listCalendarByEstrategia).toHaveBeenCalledOnce();
    expect(listRoadmapByEstrategia).toHaveBeenCalledOnce();
    expect(saveMktChatContextCache).toHaveBeenCalledWith(
      mockState.estrategiaId,
      expect.objectContaining({ companyId: mockState.companyId }),
      expect.objectContaining({
        estrategia: fixtures.estrategia,
        versao: fixtures.versao,
        calendario: fixtures.calendario,
        roadmap: fixtures.roadmap,
      }),
      30 * 60 * 1000,
    );
    expect(body.suggestions.join(' ')).toContain('Diagnostico Executivo');
    expect(body.suggestions.join(' ')).not.toContain('Campanha antiga do cache');
  });

  it('persists user and assistant messages while streaming fallback responses through SSE', async () => {
    const response = await POST(
      request({
        method: 'POST',
        body: JSON.stringify({ message: 'Reduza o budget e antecipe o calendario.' }),
      }),
      { params: Promise.resolve({ id: mockState.estrategiaId }) },
    );
    const stream = await readStream(response);
    const assistantText = collectSseDeltas(stream);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/event-stream');
    expect(stream).toContain('event: delta');
    expect(stream).toContain('event: done');
    expect(assistantText).toContain('Contexto operacional considerado');
    expect(assistantText).toContain('Transforme autoridade em pipeline.');
    expect(assistantText).toContain('2026-05-14 linkedin/organico');
    expect(assistantText).toContain('0-30d');
    expect(mockState.savedMessages.map((message) => message.role)).toEqual(['user', 'assistant']);
    expect(mockState.savedMessages[1]?.conteudo).toContain('Diagnostico Executivo');
    expect(mockState.savedMessages[1]?.conteudo).toContain('Quick win de autoridade');
    expect(mockState.savedMessages[1]?.conteudo).toContain('Refinamentos detectados: budget_redistribution, date_refinement');
    expect(enqueueJob).toHaveBeenCalledWith(
      'geracao_estrategia',
      mockState.estrategiaId,
      mockState.companyId,
      expect.objectContaining({
        source: 'chat',
        versao: 3,
        requested_by: mockState.userId,
        refinement_intents: ['budget_redistribution', 'date_refinement'],
        preserve_historical_versions: true,
      }),
    );
  });

  it('does not enqueue a new strategy version for a read-only contextual question', async () => {
    const response = await POST(
      request({
        method: 'POST',
        body: JSON.stringify({ message: 'Qual era o budget da campanha atual?' }),
      }),
      { params: Promise.resolve({ id: mockState.estrategiaId }) },
    );
    await readStream(response);

    expect(response.status).toBe(200);
    expect(enqueueJob).not.toHaveBeenCalled();
  });

  it('blocks a new chat turn when user plus assistant messages would exceed the PRD 50-message session limit', async () => {
    mockState.savedMessages.push(
      ...Array.from({ length: 49 }, (_, index) => ({
        id: crypto.randomUUID(),
        estrategia_id: mockState.estrategiaId,
        role: index % 2 === 0 ? ('user' as const) : ('assistant' as const),
        conteudo: `Mensagem ${index + 1}`,
        created_at: new Date(Date.UTC(2026, 4, 14, 10, index, 0)).toISOString(),
      })),
    );

    const response = await POST(
      request({
        method: 'POST',
        body: JSON.stringify({ message: 'Tente continuar esta sessao.' }),
      }),
      { params: Promise.resolve({ id: mockState.estrategiaId }) },
    );
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body).toMatchObject({
      code: 'LIMIT_REACHED',
      message: 'Chat limit reached. Start a new session.',
    });
    expect(mockState.savedMessages).toHaveLength(49);
    expect(enqueueJob).not.toHaveBeenCalled();
  });

  it('keeps the LLM route response in SSE format even when the SDK only returns a text stream response', async () => {
    process.env.OPENAI_API_KEY = 'test-key';

    const response = await POST(
      request({
        method: 'POST',
        body: JSON.stringify({ message: 'Simule uma mudanca de budget com impacto no calendario.' }),
      }),
      { params: Promise.resolve({ id: mockState.estrategiaId }) },
    );
    const stream = await readStream(response);
    const assistantText = collectSseDeltas(stream);
    const deltaPayloads = collectSseDeltaPayloads(stream);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/event-stream');
    expect(stream).toContain('event: delta');
    expect(stream).toContain('event: done');
    expect(assistantText).toBe(llmMocks.state.text);
    expect(deltaPayloads.every((delta) => delta.length === 1)).toBe(true);
    expect(llmMocks.streamText).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({ role: 'system', content: expect.stringContaining('Copy e captacao:') }),
          expect.objectContaining({ role: 'system', content: expect.stringContaining('Roadmap:') }),
          expect.objectContaining({ role: 'user', content: 'Simule uma mudanca de budget com impacto no calendario.' }),
        ]),
      }),
    );
    expect(mockState.savedMessages.map((message) => message.role)).toEqual(['user', 'assistant']);
    expect(mockState.savedMessages[1]?.conteudo).toBe(llmMocks.state.text);
  });

  it('applies the PRD chat rate limit per user and strategy', async () => {
    await POST(
      request({
        method: 'POST',
        body: JSON.stringify({ message: 'Teste de limite por estrategia.' }),
      }),
      { params: Promise.resolve({ id: mockState.estrategiaId }) },
    );

    expect(checkPersistentRateLimit).toHaveBeenCalledWith(
      `chat:${mockState.userId}:${mockState.companyId}:${mockState.estrategiaId}`,
      { windowMs: 60_000, maxRequests: 10 },
    );
  });
});
