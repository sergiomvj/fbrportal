import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MktProcessingJob } from '@/lib/mkt/types';

const mockState = vi.hoisted(() => {
  const estrategiaId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const companyId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const userId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

  return {
    estrategiaId,
    companyId,
    userId,
    jobs: [] as MktProcessingJob[],
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

vi.mock('@/lib/mkt/context', () => ({
  getMktRequestContext: mockState.getMktRequestContext,
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
    getEstrategia: vi.fn(async () => ({
      id: mockState.estrategiaId,
      user_id: mockState.userId,
      empresa_id: mockState.companyId,
      nome: 'Estrategia com SSE',
      status: 'processando',
      versao: 0,
    })),
  };
});

vi.mock('@/lib/mkt/queue', async () => {
  const actual = await vi.importActual<typeof import('@/lib/mkt/queue')>('@/lib/mkt/queue');

  return {
    ...actual,
    convertToProcessingJob: vi.fn((job: MktProcessingJob) => job),
    getJobsByEstrategia: vi.fn(async (_estrategiaId: string, companyId?: string) =>
      mockState.jobs.filter((job) => !companyId || job.empresa_id === companyId),
    ),
  };
});

import { resetSseForTests } from '@/lib/mkt/sse';
import { GET } from './route';

function request(accept = 'application/json') {
  return new Request(`http://localhost/api/proxy/mkt/estrategias/${mockState.estrategiaId}/status`, {
    headers: {
      accept,
      'x-user-id': mockState.userId,
      'x-company-id': mockState.companyId,
    },
  });
}

async function readFirstChunk(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) return '';
  const { value } = await reader.read();
  await reader.cancel();
  return new TextDecoder().decode(value);
}

describe('MKT strategy status route', () => {
  beforeEach(() => {
    vi.useRealTimers();
    resetSseForTests();
    mockState.jobs = [
      {
        id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
        empresa_id: mockState.companyId,
        estrategia_id: mockState.estrategiaId,
        categoria: 'geracao_estrategia',
        status: 'processing',
        tentativas: 1,
        max_tentativas: 3,
        payload: {},
        created_at: '2026-05-13T10:00:00.000Z',
        updated_at: '2026-05-13T10:01:00.000Z',
      },
    ];
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns persisted job status as JSON for polling clients', async () => {
    const response = await GET(request(), { params: Promise.resolve({ id: mockState.estrategiaId }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(body.status).toBe('analise');
    expect(body.event).toEqual(expect.objectContaining({
      stage: 'analise',
      progress: 55,
      agent: 'estrategista_bot',
    }));
  });

  it('streams the persisted bootstrap status with security headers for SSE clients', async () => {
    const response = await GET(request('text/event-stream'), { params: Promise.resolve({ id: mockState.estrategiaId }) });
    const chunk = await readFirstChunk(response);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/event-stream');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(response.headers.get('cache-control')).toBe('no-cache');
    expect(chunk).toContain('"stage":"analise"');
    expect(chunk).toContain('"progress":55');
  });

  it('continues polling persisted jobs for later SSE updates', async () => {
    vi.useFakeTimers();
    const response = await GET(request('text/event-stream'), { params: Promise.resolve({ id: mockState.estrategiaId }) });
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    expect(reader).toBeDefined();

    const first = await reader!.read();
    expect(decoder.decode(first.value)).toContain('"progress":55');

    mockState.jobs = [
      {
        ...mockState.jobs[0]!,
        categoria: 'fbr_click_delivery',
        status: 'processing',
        updated_at: '2026-05-13T10:02:00.000Z',
      },
    ];

    const next = reader!.read();
    await vi.advanceTimersByTimeAsync(5000);
    const polled = await next;
    await reader!.cancel();

    const output = decoder.decode(polled.value);
    expect(output).toContain('"progress":95');
    expect(output).toContain('FBR-Click');
  });
});
