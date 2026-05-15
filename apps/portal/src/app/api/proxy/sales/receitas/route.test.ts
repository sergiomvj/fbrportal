import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getFinanceTestCompanyIds, resetFinanceStoreForTests } from '@/lib/finance/store';
import { resetSalesStoreForTests } from '@/lib/sales/store';

function request(path: string, init: RequestInit = {}) {
  const { alpha, user } = getFinanceTestCompanyIds();

  return new Request(`http://localhost${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      'x-company-id': alpha,
      'x-user-id': user,
      ...init.headers,
    },
  });
}

describe('Sales receitas proxy routes', () => {
  beforeEach(() => {
    resetSalesStoreForTests();
    resetFinanceStoreForTests();
    delete process.env.SALES_FINANCE_INTAKE_URL;
  });

  afterEach(() => {
    delete process.env.SALES_FINANCE_INTAKE_URL;
    vi.restoreAllMocks();
  });

  it('delivers payment.received to the configured Finance intake route instead of only returning the payload', async () => {
    const receitas = await import('./route');
    const parceiros = await import('../parceiros/route');
    const financeRecebimentos = await import('../../finance/recebimentos/route');
    const endpoint = 'http://localhost/api/proxy/finance/recebimentos/sales-intake';
    process.env.SALES_FINANCE_INTAKE_URL = endpoint;

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input instanceof Request ? input.url : String(input);
      if (url !== endpoint) {
        throw new Error(`Unexpected Finance endpoint: ${url}`);
      }

      const financeIntake = await import('../../finance/recebimentos/sales-intake/route');
      const requestInit: RequestInit = {};
      if (init?.method) requestInit.method = init.method;
      if (init?.headers) requestInit.headers = init.headers;
      if (init && 'body' in init) requestInit.body = init.body ?? null;

      return financeIntake.POST(new Request(url, requestInit));
    });

    const partnerResponse = await parceiros.POST(request('/api/proxy/sales/parceiros', {
      body: JSON.stringify({
        nome: 'Parceiro Finance Bridge',
        tipo: 'patrocinio_direto',
        contato_email: 'finance-bridge@example.com',
      }),
      method: 'POST',
    }));
    const partnerBody = await partnerResponse.json();
    const partnerId = partnerBody.data.id as string;

    const receitaResponse = await receitas.POST(request('/api/proxy/sales/receitas', {
      body: JSON.stringify({
        parceiro_id: partnerId,
        periodo_ref: '2026-05',
        valor_esperado: 12500,
        valor_recebido: 12500,
        data_recebimento: '2026-05-14T12:00:00.000Z',
        status: 'reconciliado',
        observacoes: 'Pagamento confirmado por Sales.',
      }),
      method: 'POST',
    }));
    const receitaBody = await receitaResponse.json();

    const delivered = await receitas.POST(request('/api/proxy/sales/receitas?action=forward_finance', {
      body: JSON.stringify({ receita_id: receitaBody.data.id }),
      method: 'POST',
    }));
    const duplicate = await receitas.POST(request('/api/proxy/sales/receitas?action=forward_finance', {
      body: JSON.stringify({ receita_id: receitaBody.data.id }),
      method: 'POST',
    }));

    expect(delivered.status).toBe(200);
    expect(duplicate.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(fetchSpy).toHaveBeenCalledWith(
      endpoint,
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"event":"payment.received"'),
        headers: expect.objectContaining({ 'x-module-source': 'fbr-sales' }),
      }),
    );

    const deliveredBody = await delivered.json();
    const duplicateBody = await duplicate.json();
    expect(deliveredBody.data.delivery).toMatchObject({ status: 'sent', statusCode: 201 });
    expect(duplicateBody.data.delivery).toMatchObject({ status: 'sent', statusCode: 200 });
    expect(deliveredBody.data.event).toMatchObject({
      event: 'payment.received',
      data: {
        parceiro_id: partnerId,
        parceiro_nome: 'Parceiro Finance Bridge',
        empresa_id: getFinanceTestCompanyIds().alpha,
        valor: 12500,
        periodo_ref: '2026-05',
        tipo_parceria: 'patrocinio_direto',
      },
    });

    const receivables = await financeRecebimentos.GET(request('/api/proxy/finance/recebimentos?parceiro=Finance%20Bridge'));
    const receivablesBody = await receivables.json();
    expect(receivablesBody.data).toEqual([
      expect.objectContaining({
        parceiro_id: partnerId,
        partner_name: 'Parceiro Finance Bridge',
        amount: 12500,
        statement_ref: '2026-05',
        status: 'pendente',
      }),
    ]);
  });
});
