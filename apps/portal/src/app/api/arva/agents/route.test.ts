import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

const originalEnv = { ...process.env };

describe('/api/arva/agents', () => {
  beforeEach(() => {
    process.env.ARVA_BASE_URL = 'https://arva.example';
    process.env.ARVA_FBRCHAT_SHARED_TOKEN = 'server-token';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('requires company_id', async () => {
    const response = await GET(new Request('http://localhost/api/arva/agents'));

    await expect(response.json()).resolves.toMatchObject({ code: 'COMPANY_ID_MISSING' });
    expect(response.status).toBe(400);
  });

  it('proxies listAgents through server-only token boundary', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          agents: [{ id: 'agent-1', name: 'Arva Sales', role: 'comercial', tags: ['comercial'], status: 'active' }],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const response = await GET(new Request('http://localhost/api/arva/agents?company_id=company-1'));

    await expect(response.json()).resolves.toMatchObject({ agents: [{ id: 'agent-1', name: 'Arva Sales' }] });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://arva.example/api/agents?company_id=company-1',
      expect.objectContaining({
        headers: expect.objectContaining({ authorization: 'Bearer server-token' }),
      }),
    );
  });
});
