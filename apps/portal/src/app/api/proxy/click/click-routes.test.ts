import { beforeEach, describe, expect, it } from 'vitest';
import { resetClickStoreForTests } from '@/lib/click/store';

function request(path: string, init: RequestInit = {}) {
  return new Request(`http://localhost${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      'x-user-id': 'operator-1',
      'x-user-role': 'admin',
      'x-workspace-id': 'empresa-1',
      ...init.headers,
    },
  });
}

describe('Click proxy routes', () => {
  beforeEach(() => resetClickStoreForTests());

  it('creates manual deals with user context and rejects missing context', async () => {
    const { POST } = await import('./deals/route');
    const unauthorized = await POST(new Request('http://localhost/api/proxy/click/deals'));
    const response = await POST(
      request('/api/proxy/click/deals', {
        body: JSON.stringify({
          title: 'Novo deal',
          companyName: 'Gamma',
          valueCents: 50000,
          stage: 'contato_inicial',
          source: 'manual',
          priority: 'media',
          score: 44,
        }),
        method: 'POST',
      }),
    );
    const body = await response.json();

    expect(unauthorized.status).toBe(401);
    expect(response.status).toBe(201);
    expect(body.deal).toMatchObject({ companyName: 'Gamma', source: 'manual', workspaceId: 'empresa-1' });
  });

  it('creates FBR-Leads handoff idempotently in contato_inicial', async () => {
    const { POST } = await import('./deals/from-lead/route');
    const audit = await import('./audit/route');
    const payload = {
      lead_id: 'lead-new',
      empresa_nome: 'Lead Co',
      contato_email: 'lead@example.com',
      score: 88,
    };

    const first = await POST(request('/api/proxy/click/deals/from-lead', { body: JSON.stringify(payload), method: 'POST' }));
    const second = await POST(request('/api/proxy/click/deals/from-lead', { body: JSON.stringify(payload), method: 'POST' }));

    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(await second.json()).toMatchObject({ created: false, deal: { leadId: 'lead-new', stage: 'contato_inicial', source: 'fbr_leads' } });

    const auditBody = await (await audit.GET(request('/api/proxy/click/audit'))).json();
    const createdEvents = auditBody.audit.filter((event: { metadata?: { leadId?: string }; type: string }) => event.metadata?.leadId === 'lead-new' && event.type === 'created');
    expect(createdEvents).toHaveLength(1);
    expect(createdEvents[0]).toMatchObject({ metadata: { moduleSource: 'fbr_leads' } });
    expect(JSON.stringify(createdEvents)).not.toContain('manual');
  });

  it('creates append-only events for stage movement, messages, and task updates', async () => {
    const stage = await import('./deals/[id]/stage/route');
    const messages = await import('./deals/[id]/messages/route');
    const tasks = await import('./deals/[id]/tasks/route');
    const audit = await import('./audit/route');

    await stage.PATCH(request('/api/proxy/click/deals/deal-1/stage', { body: JSON.stringify({ stage: 'descoberta' }), method: 'PATCH' }), {
      params: Promise.resolve({ id: 'deal-1' }),
    });
    await messages.POST(request('/api/proxy/click/deals/deal-1/messages', { body: JSON.stringify({ body: 'Nova mensagem' }), method: 'POST' }), {
      params: Promise.resolve({ id: 'deal-1' }),
    });
    await tasks.POST(request('/api/proxy/click/deals/deal-1/tasks', { body: JSON.stringify({ title: 'Ligar', status: 'done' }), method: 'POST' }), {
      params: Promise.resolve({ id: 'deal-1' }),
    });

    const body = await (await audit.GET(request('/api/proxy/click/audit?deal_id=deal-1'))).json();
    expect(body.audit.map((event: { type: string }) => event.type)).toEqual(
      expect.arrayContaining(['stage_changed', 'message_sent', 'task_updated']),
    );
  });

  it('handles agent status, trigger errors, duplicate trigger, and admin-only controls', async () => {
    const status = await import('./agents/status/route');
    const trigger = await import('./agents/[agentId]/trigger/route');
    const agent = await import('./agents/[agentId]/route');

    expect((await (await status.GET(request('/api/proxy/click/agents/status'))).json()).agents).toHaveLength(6);
    expect(
      (
        await trigger.POST(request('/api/proxy/click/agents/agent-sdr/trigger?deal_id=missing', { method: 'POST' }), {
          params: Promise.resolve({ agentId: 'agent-sdr' }),
        })
      ).status,
    ).toBe(404);
    expect(
      (
        await trigger.POST(request('/api/proxy/click/agents/agent-closer/trigger?deal_id=deal-1', { method: 'POST' }), {
          params: Promise.resolve({ agentId: 'agent-closer' }),
        })
      ).status,
    ).toBe(503);
    expect(
      (
        await trigger.POST(request('/api/proxy/click/agents/agent-sdr/trigger?deal_id=deal-1', { method: 'POST' }), {
          params: Promise.resolve({ agentId: 'agent-sdr' }),
        })
      ).status,
    ).toBe(202);
    expect(
      (
        await trigger.POST(request('/api/proxy/click/agents/agent-sdr/trigger?deal_id=deal-1', { method: 'POST' }), {
          params: Promise.resolve({ agentId: 'agent-sdr' }),
        })
      ).status,
    ).toBe(429);
    expect(
      (
        await agent.PATCH(
          request('/api/proxy/click/agents/agent-sdr', {
            body: JSON.stringify({ paused: true }),
            headers: { 'x-user-role': 'operator' },
            method: 'PATCH',
          }),
          { params: Promise.resolve({ agentId: 'agent-sdr' }) },
        )
      ).status,
    ).toBe(403);
  });

  it('exports filtered audit as read-only CSV and isolates workspaces', async () => {
    const audit = await import('./audit/route');
    const exportRoute = await import('./audit/export/route');
    const deals = await import('./deals/route');

    const otherWorkspace = await deals.GET(request('/api/proxy/click/deals', { headers: { 'x-workspace-id': 'empresa-2' } }));
    const csv = await exportRoute.GET(request('/api/proxy/click/audit/export'));
    const filtered = await audit.GET(request('/api/proxy/click/audit?deal_id=deal-1'));

    expect((await otherWorkspace.json()).deals).toEqual([]);
    expect(csv.headers.get('content-type')).toContain('text/csv');
    expect(await csv.text()).toContain('id,deal_id,type');
    expect((await filtered.json()).audit.every((event: { dealId: string }) => event.dealId === 'deal-1')).toBe(true);
  });
});
