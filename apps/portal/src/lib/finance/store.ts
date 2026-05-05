import { DashboardKpis, Receivable, ReceivableSchema, SalesIntake } from './types';

// Mock data
let receivables: Receivable[] = [
  {
    id: 'f1-123',
    company_id: 'c1',
    partner_name: 'Google Ads',
    amount: 15000.00,
    currency: 'BRL',
    expected_date: '2026-05-10',
    status: 'pending',
    created_at: new Date().toISOString(),
  },
  {
    id: 'f1-124',
    company_id: 'c1',
    partner_name: 'Apple Services',
    amount: 8500.00,
    currency: 'BRL',
    expected_date: '2026-05-15',
    status: 'received',
    received_date: '2026-05-01',
    created_at: new Date().toISOString(),
  }
];

export function contextFromHeaders(headers: Headers) {
  const companyId = headers.get('X-Company-Id') || 'c1';
  const userId = headers.get('X-User-Id') || 'u1';
  return { companyId, userId };
}

export function listReceivables(context: { companyId: string }) {
  return receivables.filter(r => r.company_id === context.companyId);
}

export function createReceivable(context: { companyId: string, userId: string }, data: any) {
  const validated = ReceivableSchema.parse({
    ...data,
    company_id: context.companyId,
    created_by: context.userId,
    created_at: new Date().toISOString(),
    id: crypto.randomUUID(),
  });
  receivables.push(validated);
  return validated;
}

export function reconcileReceivable(context: { companyId: string }, id: string, amount_received: number) {
  const index = receivables.findIndex(r => r.id === id && r.company_id === context.companyId);
  if (index === -1) throw new Error('Receivable not found');

  const receivable = receivables[index];
  if (receivable.status === 'received' || receivable.status === 'divergent') {
    throw new Error('Already reconciled');
  }

  const divergence = Math.abs(amount_received - receivable.amount) / receivable.amount;
  
  if (divergence <= 0.05) {
    receivable.status = 'received';
  } else {
    receivable.status = 'divergent';
  }
  
  receivable.received_date = new Date().toISOString();
  return receivable;
}

export function getDashboardKpis(context: { companyId: string }): DashboardKpis {
  const companyReceivables = listReceivables(context);
  
  const receita_total = companyReceivables
    .filter(r => r.status === 'received')
    .reduce((sum, r) => sum + r.amount, 0);

  const a_receber = companyReceivables
    .filter(r => r.status === 'pending')
    .reduce((sum, r) => sum + r.amount, 0);

  const atrasados = companyReceivables
    .filter(r => r.status === 'overdue')
    .length;

  const divergencias = companyReceivables
    .filter(r => r.status === 'divergent')
    .length;

  return {
    receita_total,
    a_receber,
    atrasados,
    divergencias,
    projecao_30d: receita_total * 1.1, // Simple mock projection
    delta_percentual: 12.5, // Mock delta
    receita_por_parceiro: [
      { name: 'Google Ads', value: 15000 },
      { name: 'Apple Services', value: 8500 }
    ],
    receita_por_empresa: [
      { name: 'Facebrasil Corp', value: 23500 }
    ]
  };
}

export function processSalesIntake(data: SalesIntake) {
  const { data: intakeData } = data;
  
  // Idempotency check (mock)
  const existing = receivables.find(r => 
    r.partner_name === intakeData.parceiro_nome && 
    r.expected_date === intakeData.data_recebimento &&
    r.amount === intakeData.valor
  );

  if (existing) return { status: 'exists', receivable: existing };

  const newReceivable: Receivable = {
    id: crypto.randomUUID(),
    company_id: intakeData.empresa_id,
    partner_name: intakeData.parceiro_nome,
    amount: intakeData.valor,
    currency: intakeData.moeda,
    expected_date: intakeData.data_recebimento,
    status: 'pending',
    created_at: new Date().toISOString(),
    statement_ref: intakeData.periodo_ref
  };

  receivables.push(newReceivable);
  return { status: 'created', receivable: newReceivable };
}
