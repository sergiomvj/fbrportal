import { beforeEach, describe, expect, it } from 'vitest';
import { buildDealClosedEvent, resetClickStoreForTests } from '@/lib/click/store';
import { buildSalesClickWebhookSignature, getSalesTestCompanyIds, resetSalesStoreForTests } from '@/lib/sales/store';

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
  beforeEach(() => {
    resetClickStoreForTests();
    resetSalesStoreForTests();
  });

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
      event: 'lead.qualified',
      data: {
        lead_id: 'lead-new',
        empresa_nome: 'Lead Co',
        contato_nome: 'Ana Lead',
        contato_email: 'lead@example.com',
        score: 88,
        historico_interacoes: [],
        dados_enriquecimento: {},
        cadencia_completa: true,
        total_respostas: 1,
      },
    };

    const first = await POST(request('/api/proxy/click/deals/from-lead', {
      body: JSON.stringify(payload),
      headers: { 'x-module-source': 'leads' },
      method: 'POST',
    }));
    const second = await POST(request('/api/proxy/click/deals/from-lead', {
      body: JSON.stringify(payload),
      headers: { 'x-module-source': 'leads' },
      method: 'POST',
    }));

    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(await second.json()).toMatchObject({ created: false, deal: { leadId: 'lead-new', stage: 'contato_inicial', source: 'fbr_leads' } });

    const auditBody = await (await audit.GET(request('/api/proxy/click/audit'))).json();
    const createdEvents = auditBody.audit.filter((event: { metadata?: { leadId?: string }; type: string }) => event.metadata?.leadId === 'lead-new' && event.type === 'created');
    const receivedEvents = auditBody.audit.filter((event: { metadata?: { leadId?: string }; type: string }) => event.metadata?.leadId === 'lead-new' && event.type === 'lead_received');
    expect(createdEvents).toHaveLength(1);
    expect(receivedEvents).toHaveLength(1);
    expect(createdEvents[0]).toMatchObject({ metadata: { moduleSource: 'leads' } });
    expect(receivedEvents[0]).toMatchObject({ metadata: { payload } });
    expect(JSON.stringify(createdEvents)).not.toContain('manual');
  });

  it('accepts strategy.exported events from FBR-MKT into Click audit', async () => {
    const events = await import('./events/route');
    const audit = await import('./audit/route');
    const payload = {
      event: 'strategy.exported',
      data: {
        estrategia_id: 'mkt-strategy-1',
        nome: 'Plano MKT',
        nicho: 'SaaS',
        documento_original: 'uploads/empresa/doc.pdf',
        score_viabilidade: 82,
        canais_sugeridos: ['linkedin', 'google_ads'],
        exportado_por: 'operator-1',
      },
    };

    const accepted = await events.POST(request('/api/proxy/click/events', {
      body: JSON.stringify(payload),
      headers: { 'x-module-source': 'fbr-mkt' },
      method: 'POST',
    }));

    expect(accepted.status).toBe(202);
    expect(await accepted.json()).toEqual({ accepted: true, event: 'strategy.exported' });

    const body = await (await audit.GET(request('/api/proxy/click/audit'))).json();
    expect(body.audit).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          dealId: 'mkt-strategy-1',
          type: 'cross_module_event',
          metadata: expect.objectContaining({ event: 'strategy.exported', moduleSource: 'fbr-mkt' }),
        }),
      ]),
    );
  });

  it('builds deal.closed from a closed Click deal and delivers it to the official Sales webhook with HMAC', async () => {
    const deals = await import('./deals/route');
    const stage = await import('./deals/[id]/stage/route');
    const salesWebhook = await import('../sales/webhooks/fbr-click/deal-closed/route');
    const salesPartners = await import('../sales/parceiros/route');
    const { alpha, user } = getSalesTestCompanyIds();
    const secret = 'test-click-sales-secret';
    process.env.SALES_FBR_CLICK_WEBHOOK_SECRET = secret;

    const created = await deals.POST(request('/api/proxy/click/deals', {
      body: JSON.stringify({
        title: 'Patrocinio Revista Online',
        companyName: 'Cliente Click Sales',
        contactName: 'Marina Cliente',
        contactEmail: 'marina@cliente.example',
        contactPhone: '+55 11 99999-0101',
        valueCents: 2500000,
        stage: 'negociacao',
        source: 'manual',
        priority: 'alta',
        score: 91,
      }),
      headers: { 'x-workspace-id': alpha },
      method: 'POST',
    }));
    const createdBody = await created.json();
    const dealId = createdBody.deal.id as string;

    await stage.PATCH(request(`/api/proxy/click/deals/${dealId}/stage`, {
      body: JSON.stringify({ stage: 'fechamento' }),
      headers: { 'x-workspace-id': alpha },
      method: 'PATCH',
    }), { params: Promise.resolve({ id: dealId }) });

    const payload = buildDealClosedEvent({
      userId: 'operator-1',
      workspaceId: alpha,
      role: 'admin',
      moduleSource: 'click',
    }, dealId);
    expect(payload).toMatchObject({
      event: 'deal.closed',
      data: {
        deal_id: dealId,
        empresa_nome: 'Cliente Click Sales',
        valor_estimado: 25000,
        moeda: 'BRL',
        produto_fechado: 'Patrocinio Revista Online',
      },
    });

    const body = JSON.stringify(payload);
    const delivered = await salesWebhook.POST(new Request('http://localhost/api/proxy/sales/webhooks/fbr-click/deal-closed', {
      body,
      headers: {
        'content-type': 'application/json',
        'x-company-id': alpha,
        'x-module-source': 'fbr-click',
        'x-user-id': user,
        'x-webhook-signature': buildSalesClickWebhookSignature(body, secret),
      },
      method: 'POST',
    }));
    const duplicate = await salesWebhook.POST(new Request('http://localhost/api/proxy/sales/webhooks/fbr-click/deal-closed', {
      body,
      headers: {
        'content-type': 'application/json',
        'x-company-id': alpha,
        'x-module-source': 'fbr-click',
        'x-user-id': user,
        'x-webhook-signature': buildSalesClickWebhookSignature(body, secret),
      },
      method: 'POST',
    }));
    const invalidSignature = await salesWebhook.POST(new Request('http://localhost/api/proxy/sales/webhooks/fbr-click/deal-closed', {
      body,
      headers: {
        'content-type': 'application/json',
        'x-company-id': alpha,
        'x-module-source': 'fbr-click',
        'x-user-id': user,
        'x-webhook-signature': 'bad-signature',
      },
      method: 'POST',
    }));

    expect(delivered.status).toBe(201);
    expect(duplicate.status).toBe(200);
    expect(invalidSignature.status).toBe(401);

    const partners = await salesPartners.GET(new Request('http://localhost/api/proxy/sales/parceiros?busca=Cliente%20Click%20Sales', {
      headers: { 'x-company-id': alpha, 'x-user-id': user },
    }));
    const partnersBody = await partners.json();
    expect(partnersBody.data).toEqual([
      expect.objectContaining({
        nome: 'Cliente Click Sales',
        contato_email: 'marina@cliente.example',
        estagio: 'onboarding',
        valor_estimado: 25000,
      }),
    ]);
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
