import { beforeEach, describe, expect, it } from 'vitest';
import { resetClickStoreForTests } from '@/lib/click/store';
import { getLeadsTestCompanyIds, resetLeadsStoreForTests } from '@/lib/leads/store';

const ids = getLeadsTestCompanyIds();

function leadsRequest(body: unknown) {
  return new Request('http://localhost/api/proxy/leads/handoff', {
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
      'x-company-id': ids.alpha,
      'x-module-source': 'leads',
      'x-user-id': ids.user,
    },
    method: 'POST',
  });
}

function clickRequest(path: string) {
  return new Request(`http://localhost${path}`, {
    headers: {
      'content-type': 'application/json',
      'x-company-id': ids.alpha,
      'x-module-source': 'leads',
      'x-user-id': ids.user,
    },
  });
}

describe('Leads handoff proxy route', () => {
  beforeEach(() => {
    resetLeadsStoreForTests();
    resetClickStoreForTests();
  });

  it('sends a complete lead.qualified handoff to Click and preserves the payload in audit', async () => {
    const { POST } = await import('./route');
    const clickAudit = await import('@/app/api/proxy/click/audit/route');

    const response = await POST(leadsRequest({ lead_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa02' }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.deal_id).toEqual(expect.any(String));
    expect(body.click).toMatchObject({
      leadId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa02',
      source: 'fbr_leads',
      stage: 'contato_inicial',
    });
    expect(body.handoff).toMatchObject({
      event: 'lead.qualified',
      module_source: 'fbr-leads',
      data: {
        lead_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa02',
        empresa_id: ids.alpha,
        etapa_final: 'sql_entregue',
        cadencia: {
          total_toques: 4,
          toques_enviados: 2,
        },
        deduplicacao: {
          fontes_origem: expect.arrayContaining(['google_maps']),
        },
        prioridade: 'alta',
      },
    });
    expect(body.handoff.data.cadencia.total_aberturas).toBeGreaterThanOrEqual(1);
    expect(body.handoff.data.historico_interacoes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tipo: 'email_respondido',
          metadata: expect.objectContaining({ toque_numero: 1 }),
        }),
      ]),
    );

    const auditBody = await (await clickAudit.GET(clickRequest('/api/proxy/click/audit'))).json();
    expect(auditBody.audit).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          dealId: body.deal_id,
          type: 'lead_received',
          metadata: expect.objectContaining({
            moduleSource: 'leads',
            payload: expect.objectContaining({
              module_source: 'fbr-leads',
              data: expect.objectContaining({
                lead_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa02',
                cadencia: expect.objectContaining({ toques_enviados: 2 }),
                deduplicacao: expect.objectContaining({ fontes_origem: expect.arrayContaining(['google_maps']) }),
              }),
            }),
          }),
        }),
      ]),
    );
  });
});
