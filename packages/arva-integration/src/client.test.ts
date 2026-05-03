import { describe, expect, it, vi } from 'vitest';
import { ArvaIntegrationError, listAgents, openChat, resolveAgent } from './index';
import { createArvaServerHeaders } from './server';

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'content-type': 'application/json' },
  });
}

describe('arva integration client', () => {
  it('lists agents with encoded company id and normalized payload', async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse({
        agents: [
          {
            id: 'agent-1',
            name: 'Arva Sales',
            role: 'comercial',
            tags: ['comercial'],
            status: 'active',
          },
        ],
      }),
    );

    await expect(listAgents('company 1', { baseUrl: 'https://arva.example/', fetcher })).resolves.toEqual([
      {
        id: 'agent-1',
        name: 'Arva Sales',
        role: 'comercial',
        tags: ['comercial'],
        status: 'active',
        fbrchatId: undefined,
        avatarUrl: undefined,
        persona: undefined,
        runtime: undefined,
        performance: undefined,
      },
    ]);
    expect(fetcher).toHaveBeenCalledWith('https://arva.example/api/agents?company_id=company%201', { method: 'GET' });
  });

  it('resolves agent identity through the documented endpoint', async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse({
        agent: {
          agentId: 'agent-1',
          fbrchatId: 'chat-1',
          displayName: 'Arva Finance',
          persona: { role: 'financeiro' },
          runtime: { status: 'active', tags: ['financeiro'] },
        },
      }),
    );

    await expect(resolveAgent('chat-1', { baseUrl: 'https://arva.example', fetcher })).resolves.toMatchObject({
      agentId: 'agent-1',
      fbrchatId: 'chat-1',
      displayName: 'Arva Finance',
      persona: { role: 'financeiro' },
    });
    expect(fetcher).toHaveBeenCalledWith(
      'https://arva.example/api/integrations/fbrchat/resolve-agent',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ fbrchatId: 'chat-1' }) }),
    );
  });

  it('opens chat and maps result', async () => {
    const fetcher = vi.fn(async () => jsonResponse({ chat: { chatId: 'chat-open-1', url: 'https://chat.example' } }));

    await expect(openChat('agent-1', 'user-1', { baseUrl: 'https://arva.example', fetcher })).resolves.toEqual({
      chatId: 'chat-open-1',
      url: 'https://chat.example',
      agentId: 'agent-1',
      userId: 'user-1',
    });
  });

  it('normalizes non-2xx and malformed payload errors', async () => {
    await expect(
      listAgents('company-1', {
        baseUrl: 'https://arva.example',
        fetcher: async () => jsonResponse({ message: 'No access' }, { status: 403 }),
      }),
    ).rejects.toMatchObject({ code: 'ARVA_API_ERROR', status: 403 });

    await expect(
      listAgents('company-1', {
        baseUrl: 'https://arva.example',
        fetcher: async () => jsonResponse({ agents: [{ id: 'missing-name' }] }),
      }),
    ).rejects.toMatchObject({ code: 'ARVA_MALFORMED_PAYLOAD' });
  });

  it('validates env and keeps shared token server-only', () => {
    expect(() => createArvaServerHeaders({ baseUrl: 'https://arva.example' })).toThrow(ArvaIntegrationError);
    expect(createArvaServerHeaders({ baseUrl: 'https://arva.example', sharedToken: 'server-token' })).toEqual({
      authorization: 'Bearer server-token',
      'content-type': 'application/json',
    });
  });
});
