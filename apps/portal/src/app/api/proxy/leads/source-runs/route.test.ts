import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockState = vi.hoisted(() => {
  const companyId = '11111111-1111-4111-8111-111111111111';
  const userId = '33333333-3333-4333-8333-333333333333';
  const runId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const leadId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

  return {
    companyId,
    userId,
    run: {
      id: runId,
      company_id: companyId,
      fonte: 'cnpj_biz',
      status: 'done',
      total_records: 1,
      leads_created: 1,
      duplicates: 0,
      failed_records: 0,
      query: { cnae: '6201-5/01' },
    },
    records: [{
      id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      company_id: companyId,
      source_run_id: runId,
      fonte: 'cnpj_biz',
      source_key: 'cnpj_biz:33.333.333/0001-33',
      duplicate_status: 'new',
      normalized_lead_id: leadId,
      raw_payload: {},
      captured_at: '2026-05-14T10:00:00.000Z',
    }],
    leads: [{
      id: leadId,
      company_id: companyId,
      empresa_nome: 'Route Capture',
      contato_nome: 'Contato a identificar',
      contato_email: 'ops@routecapture.com.br',
      fonte: 'cnpj_biz',
      etapa: 'captado',
    }],
    leadId,
  };
});

vi.mock('@/lib/leads/store-db', () => ({
  contextFromHeaders: (headers: Headers) => {
    const userId = headers.get('x-user-id');
    const companyId = headers.get('x-company-id') ?? headers.get('x-workspace-id');
    if (!userId || !companyId) {
      return Response.json({ code: 'UNAUTHORIZED_CONTEXT' }, { status: 401 });
    }

    return {
      companyId,
      userId,
      moduleSource: headers.get('x-module-source') ?? 'fbr-portal',
    };
  },
}));

vi.mock('@/lib/leads/source-capture', () => ({
  captureLeadsFromSourceDb: vi.fn(async () => ({
    run: mockState.run,
    records: mockState.records,
    leads: mockState.leads,
    leads_created: 1,
    duplicates: 0,
    failed: 0,
  })),
  getSourceRunDb: vi.fn(async () => mockState.run),
  listSourceRunsDb: vi.fn(async () => [mockState.run]),
  listSourceRecordsByRunDb: vi.fn(async () => mockState.records),
}));

import { captureLeadsFromSourceDb } from '@/lib/leads/source-capture';
import { GET, POST } from './route';

function request(path: string, init: RequestInit = {}) {
  return new Request(`http://localhost${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      'x-company-id': mockState.companyId,
      'x-user-id': mockState.userId,
      'x-module-source': 'leads',
      ...(init.headers ?? {}),
    },
  });
}

describe('Leads source runs route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates an auditable source run with normalized lead and source record', async () => {
    const payload = {
      fonte: 'cnpj_biz',
      query: { cnae: '6201-5/01' },
      records: [{
        cnpj: '33.333.333/0001-33',
        razao_social: 'Route Capture Ltda',
        nome_fantasia: 'Route Capture',
        email_cadastral: 'ops@routecapture.com.br',
      }],
    };

    const response = await POST(request('/api/proxy/leads/source-runs', {
      method: 'POST',
      body: JSON.stringify(payload),
    }));

    expect(response.status).toBe(201);
    expect(captureLeadsFromSourceDb).toHaveBeenCalledWith(
      expect.objectContaining({ companyId: mockState.companyId, userId: mockState.userId }),
      payload,
    );
    const body = await response.json();
    expect(body.run).toMatchObject({
      fonte: 'cnpj_biz',
      status: 'done',
      total_records: 1,
      leads_created: 1,
    });
    expect(body.records[0]).toMatchObject({
      fonte: 'cnpj_biz',
      duplicate_status: 'new',
      source_key: 'cnpj_biz:33.333.333/0001-33',
      normalized_lead_id: mockState.leadId,
    });
    expect(body.leads[0]).toMatchObject({
      empresa_nome: 'Route Capture',
      contato_email: 'ops@routecapture.com.br',
      fonte: 'cnpj_biz',
    });

    const detail = await GET(request(`/api/proxy/leads/source-runs?id=${body.run.id}`));
    expect(detail.status).toBe(200);
    expect(await detail.json()).toMatchObject({
      run: { id: body.run.id, status: 'done' },
      records: [{ source_run_id: body.run.id }],
    });
  });

  it('requires the approved proxy context before source capture', async () => {
    const response = await POST(new Request('http://localhost/api/proxy/leads/source-runs', {
      method: 'POST',
      body: JSON.stringify({ fonte: 'linkedin', records: [] }),
      headers: { 'content-type': 'application/json' },
    }));

    expect(response.status).toBe(401);
  });
});
