import { z } from 'zod';
import {
  DashboardKpis,
  FinanceStatus,
  FinanceStatusSchema,
  Receivable,
  ReceivableSchema,
  ReceivablesQuery,
  ReceivablesQuerySchema,
  SalesIntake,
  SalesIntakeSchema,
  Payable,
  PayableSchema,
  PayablesQuery,
  PayablesQuerySchema,
  CostCenter,
  CostCenterNode,
  ProfitLoss,
  ApprovalThreshold,
  FinancialEvent,
  FinancialEventSchema,
  ReconciliationItem,
  ReconciliationJob,
} from './types';

export interface FinanceRequestContext {
  companyId: string;
  userId: string;
  moduleSource: string;
}

export class FinanceValidationError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 409 | 422,
    readonly issues?: unknown,
  ) {
    super(message);
  }
}

const COMPANY_ALPHA = '11111111-1111-4111-8111-111111111111';
const COMPANY_BETA = '22222222-2222-4222-8222-222222222222';
const USER_SYSTEM = '33333333-3333-4333-8333-333333333333';

const initialReceivables: Receivable[] = [
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    company_id: COMPANY_ALPHA,
    parceiro_id: '44444444-4444-4444-8444-444444444441',
    partner_name: 'Google Ads',
    amount: 15000,
    currency: 'BRL',
    expected_date: '2026-05-10',
    status: 'pendente',
    created_by: USER_SYSTEM,
    created_at: '2026-05-01T10:00:00.000Z',
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
    company_id: COMPANY_ALPHA,
    parceiro_id: '44444444-4444-4444-8444-444444444442',
    partner_name: 'Apple Services',
    amount: 8500,
    currency: 'BRL',
    expected_date: '2026-04-20',
    received_date: '2026-05-01',
    status: 'recebido',
    statement_ref: '2026-04',
    created_by: USER_SYSTEM,
    created_at: '2026-04-20T10:00:00.000Z',
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
    company_id: COMPANY_ALPHA,
    parceiro_id: '44444444-4444-4444-8444-444444444443',
    partner_name: 'Meta Partners',
    amount: 1200,
    currency: 'BRL',
    expected_date: '2026-04-15',
    status: 'atrasado',
    created_by: USER_SYSTEM,
    created_at: '2026-04-01T10:00:00.000Z',
  },
  {
    id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
    company_id: COMPANY_BETA,
    parceiro_id: '55555555-5555-4555-8555-555555555551',
    partner_name: 'Beta Partner',
    amount: 9900,
    currency: 'BRL',
    expected_date: '2026-05-12',
    status: 'pendente',
    created_by: USER_SYSTEM,
    created_at: '2026-05-02T10:00:00.000Z',
  },
];

let receivables: Receivable[] = [];
let reconciliationCalls = 0;

const initialPayables: Payable[] = [
  {
    id: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
    company_id: COMPANY_ALPHA,
    fornecedor_nome: 'Fornecedor Alpha',
    descricao: 'Serviços de marketing',
    amount: 5000,
    currency: 'BRL',
    data_vencimento: '2026-05-15',
    status: 'pendente',
    recorrente: false,
    created_by: USER_SYSTEM,
    created_at: '2026-05-01T10:00:00.000Z',
  },
  {
    id: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc2',
    company_id: COMPANY_ALPHA,
    fornecedor_nome: 'Fornecedor Beta',
    descricao: 'Licenças de software',
    amount: 2500,
    currency: 'BRL',
    data_vencimento: '2026-05-20',
    data_pagamento: '2026-05-18',
    status: 'pago',
    recorrente: true,
    recorrencia_frequencia: 'mensal',
    created_by: USER_SYSTEM,
    created_at: '2026-04-15T10:00:00.000Z',
  },
  {
    id: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc3',
    company_id: COMPANY_ALPHA,
    fornecedor_nome: 'Fornecedor Gamma',
    descricao: 'Consultoria financeira',
    amount: 15000,
    currency: 'BRL',
    data_vencimento: '2026-06-01',
    status: 'pendente',
    recorrente: false,
    created_by: USER_SYSTEM,
    created_at: '2026-05-05T10:00:00.000Z',
  },
];

const initialCostCenters: CostCenter[] = [
  {
    id: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd1',
    company_id: COMPANY_ALPHA,
    nome: 'Marketing',
    descricao: 'Departamento de Marketing',
    nivel: 1,
    ativo: true,
    created_at: '2026-01-01T10:00:00.000Z',
  },
  {
    id: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd2',
    company_id: COMPANY_ALPHA,
    nome: 'Digital',
    descricao: 'Marketing Digital',
    parent_id: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd1',
    nivel: 2,
    ativo: true,
    created_at: '2026-01-01T10:00:00.000Z',
  },
  {
    id: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd3',
    company_id: COMPANY_ALPHA,
    nome: 'Financeiro',
    descricao: 'Departamento Financeiro',
    nivel: 1,
    ativo: true,
    created_at: '2026-01-01T10:00:00.000Z',
  },
];

const initialApprovalThresholds: ApprovalThreshold[] = [
  {
    id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1',
    company_id: COMPANY_ALPHA,
    role: 'gestor',
    valor_minimo: 0,
    valor_maximo: 5000,
    created_at: '2026-01-01T10:00:00.000Z',
  },
  {
    id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2',
    company_id: COMPANY_ALPHA,
    role: 'cfo',
    valor_minimo: 5001,
    valor_maximo: 50000,
    created_at: '2026-01-01T10:00:00.000Z',
  },
  {
    id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee3',
    company_id: COMPANY_ALPHA,
    role: 'owner',
    valor_minimo: 50001,
    valor_maximo: Number.MAX_SAFE_INTEGER,
    created_at: '2026-01-01T10:00:00.000Z',
  },
];

let payables: Payable[] = [];
let costCenters: CostCenter[] = [];
let approvalThresholds: ApprovalThreshold[] = [];
let reconciliationItems: ReconciliationItem[] = [];
let reconciliationJobs: ReconciliationJob[] = [];

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function now() {
  return new Date().toISOString();
}

function parseJsonObject(input: unknown) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new FinanceValidationError('JSON object payload is required.', 400);
  }

  return input;
}

function normalizeZodError(error: z.ZodError) {
  const hasMissingRequired = error.issues.some((issue) => issue.code === 'invalid_type' && issue.received === 'undefined');
  return new FinanceValidationError(hasMissingRequired ? 'Required fields are missing.' : 'Payload validation failed.', hasMissingRequired ? 400 : 422, error.issues);
}

export function resetFinanceStoreForTests() {
  receivables = clone(initialReceivables);
  payables = clone(initialPayables);
  costCenters = clone(initialCostCenters);
  approvalThresholds = clone(initialApprovalThresholds);
  reconciliationItems = [];
  reconciliationJobs = [];
  reconciliationCalls = 0;
}

resetFinanceStoreForTests();

export function getFinanceTestCompanyIds() {
  return { alpha: COMPANY_ALPHA, beta: COMPANY_BETA, user: USER_SYSTEM };
}

export function getAutomaticReconciliationCallCount() {
  return reconciliationCalls;
}

export function contextFromHeaders(headers: Headers): FinanceRequestContext | Response {
  const userId = headers.get('x-user-id');
  const companyId = headers.get('x-company-id') ?? headers.get('x-workspace-id') ?? headers.get('x-empresa-id');
  const moduleSource = headers.get('x-module-source') ?? 'fbr-portal';

  if (!userId || !companyId) {
    return Response.json({ code: 'UNAUTHORIZED_CONTEXT', message: 'X-User-Id and company headers are required.' }, { status: 401 });
  }

  const companyCheck = z.string().uuid().safeParse(companyId);
  if (!companyCheck.success) {
    return Response.json({ code: 'INVALID_COMPANY', message: 'Company header must be a valid UUID.' }, { status: 422 });
  }

  return { userId, companyId, moduleSource };
}

export function parseReceivablesQuery(url: string): ReceivablesQuery {
  const params = new URL(url).searchParams;
  const rawStatus = params.getAll('status').flatMap((item) => item.split(',')).filter(Boolean);

  try {
    return ReceivablesQuerySchema.parse({
      parceiro: params.get('parceiro') ?? undefined,
      status: rawStatus.length > 0 ? rawStatus : undefined,
      data_inicio: params.get('data_inicio') ?? undefined,
      data_fim: params.get('data_fim') ?? undefined,
      empresa_id: params.get('empresa_id') ?? undefined,
      page: params.get('page') ?? undefined,
      page_size: params.get('page_size') ?? undefined,
      sort_by: params.get('sort_by') ?? undefined,
      sort_dir: params.get('sort_dir') ?? undefined,
    });
  } catch (error) {
    if (error instanceof z.ZodError) throw normalizeZodError(error);
    throw error;
  }
}

export function listReceivables(context: FinanceRequestContext, query: Partial<ReceivablesQuery> = {}) {
  const parsed = ReceivablesQuerySchema.parse(query);
  const targetCompany = parsed.empresa_id ?? context.companyId;

  if (targetCompany !== context.companyId) {
    return { items: [], pagination: { page: parsed.page, page_size: parsed.page_size, total: 0, total_pages: 0 } };
  }

  const partner = parsed.parceiro?.toLowerCase();
  const filtered = receivables.filter((receivable) => {
    if (receivable.company_id !== context.companyId) return false;
    if (partner && !receivable.partner_name.toLowerCase().includes(partner)) return false;
    if (parsed.status && !parsed.status.includes(receivable.status)) return false;
    if (parsed.data_inicio && receivable.expected_date < parsed.data_inicio) return false;
    if (parsed.data_fim && receivable.expected_date > parsed.data_fim) return false;
    return true;
  });

  filtered.sort((left, right) => {
    const direction = parsed.sort_dir === 'asc' ? 1 : -1;
    const leftValue = left[parsed.sort_by];
    const rightValue = right[parsed.sort_by];
    return leftValue > rightValue ? direction : leftValue < rightValue ? -direction : 0;
  });

  const start = (parsed.page - 1) * parsed.page_size;
  const items = filtered.slice(start, start + parsed.page_size);

  return {
    items,
    pagination: {
      page: parsed.page,
      page_size: parsed.page_size,
      total: filtered.length,
      total_pages: Math.ceil(filtered.length / parsed.page_size),
    },
  };
}

export function createReceivable(context: FinanceRequestContext, data: unknown) {
  const input = parseJsonObject(data);

  try {
    const validated = ReceivableSchema.parse({
      ...input,
      company_id: context.companyId,
      created_by: context.userId,
      created_at: now(),
      id: crypto.randomUUID(),
    });

    receivables.push(validated);
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) throw normalizeZodError(error);
    throw error;
  }
}

export function reconcileReceivable(context: FinanceRequestContext, id: string, data: unknown) {
  const payload = z.object({ amount_received: z.number().positive() }).safeParse(parseJsonObject(data));
  if (!payload.success) throw normalizeZodError(payload.error);

  const receivable = receivables.find((item) => item.id === id && item.company_id === context.companyId);
  if (!receivable) throw new Error('Receivable not found');

  if (receivable.status === 'recebido' || receivable.status === 'divergente') {
    throw new Error('Already reconciled');
  }

  receivable.received_date = now();
  receivable.status = calculateReconciliationStatus(receivable.amount, payload.data.amount_received);
  return receivable;
}

export function getDashboardKpis(context: FinanceRequestContext): DashboardKpis {
  const companyReceivables = receivables.filter((receivable) => receivable.company_id === context.companyId);
  const received = companyReceivables.filter((receivable) => receivable.status === 'recebido');
  const pending = companyReceivables.filter((receivable) => receivable.status === 'pendente');
  const today = '2026-05-05';
  const inThirtyDays = '2026-06-04';
  const currentPeriodStart = '2026-05-01';
  const previousPeriodStart = '2026-04-01';
  const previousPeriodEnd = '2026-04-30';

  const receitaTotal = sum(received);
  const previousRevenue = sum(received.filter((receivable) => receivable.received_date && receivable.received_date >= previousPeriodStart && receivable.received_date <= previousPeriodEnd));
  const currentRevenue = sum(received.filter((receivable) => receivable.received_date && receivable.received_date >= currentPeriodStart));

  return {
    receita_total: receitaTotal,
    a_receber: sum(pending),
    atrasados: companyReceivables.filter((receivable) => receivable.status === 'atrasado' || (receivable.status === 'pendente' && receivable.expected_date < today)).length,
    divergencias: companyReceivables.filter((receivable) => receivable.status === 'divergente').length,
    projecao_30d: sum(pending.filter((receivable) => receivable.expected_date >= today && receivable.expected_date <= inThirtyDays)),
    delta_percentual: previousRevenue === 0 ? (currentRevenue > 0 ? 100 : 0) : Number((((currentRevenue - previousRevenue) / previousRevenue) * 100).toFixed(2)),
    receita_por_parceiro: groupRevenue(received, (receivable) => receivable.partner_name),
    receita_por_empresa: [{ name: context.companyId, value: receitaTotal }],
  };
}

export function processSalesIntake(context: FinanceRequestContext, data: unknown) {
  if (context.moduleSource !== 'fbr-sales') {
    throw new FinanceValidationError('X-Module-Source must be fbr-sales for payment.received intake.', 422);
  }

  let payload: SalesIntake;
  try {
    payload = SalesIntakeSchema.parse(parseJsonObject(data));
  } catch (error) {
    if (error instanceof z.ZodError) throw normalizeZodError(error);
    throw error;
  }

  if (payload.data.empresa_id !== context.companyId) {
    throw new FinanceValidationError('Payload company must match request company context.', 422);
  }

  const existing = receivables.find(
    (receivable) =>
      receivable.company_id === context.companyId &&
      receivable.parceiro_id === payload.data.parceiro_id &&
      receivable.statement_ref === payload.data.periodo_ref &&
      receivable.expected_date === payload.data.data_recebimento.slice(0, 10),
  );

  if (existing) return { created: false, receivable: existing };

  const receivable: Receivable = {
    id: crypto.randomUUID(),
    company_id: payload.data.empresa_id,
    parceiro_id: payload.data.parceiro_id,
    partner_name: payload.data.parceiro_nome,
    amount: payload.data.valor,
    currency: payload.data.moeda,
    expected_date: payload.data.data_recebimento.slice(0, 10),
    status: 'pendente',
    statement_ref: payload.data.periodo_ref,
    created_by: context.userId,
    created_at: now(),
  };

  receivables.push(receivable);
  automaticReconciliation(receivable);
  return { created: true, receivable };
}

function automaticReconciliation(receivable: Receivable) {
  reconciliationCalls += 1;
  if (receivable.statement_ref === 'auto-match') {
    receivable.status = 'recebido';
    receivable.received_date = now();
  }
}

function calculateReconciliationStatus(expected: number, received: number): FinanceStatus {
  return Math.abs(received - expected) / expected <= 0.05 ? FinanceStatusSchema.enum.recebido : FinanceStatusSchema.enum.divergente;
}

function sum(items: Receivable[]) {
  return Number(items.reduce((total, receivable) => total + receivable.amount, 0).toFixed(2));
}

function groupRevenue(items: Receivable[], getName: (receivable: Receivable) => string) {
  const grouped = new Map<string, number>();
  for (const item of items) grouped.set(getName(item), (grouped.get(getName(item)) ?? 0) + item.amount);
  return [...grouped].map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }));
}

export function parsePayablesQuery(url: string): PayablesQuery {
  const params = new URL(url).searchParams;
  const rawStatus = params.getAll('status').flatMap((item) => item.split(',')).filter(Boolean);

  try {
    return PayablesQuerySchema.parse({
      fornecedor: params.get('fornecedor') ?? undefined,
      status: rawStatus.length > 0 ? rawStatus : undefined,
      data_inicio: params.get('data_inicio') ?? undefined,
      data_fim: params.get('data_fim') ?? undefined,
      empresa_id: params.get('empresa_id') ?? undefined,
      page: params.get('page') ?? undefined,
      page_size: params.get('page_size') ?? undefined,
      sort_by: params.get('sort_by') ?? undefined,
      sort_dir: params.get('sort_dir') ?? undefined,
    });
  } catch (error) {
    if (error instanceof z.ZodError) throw normalizeZodError(error);
    throw error;
  }
}

export function listPayables(context: FinanceRequestContext, query: Partial<PayablesQuery> = {}) {
  const parsed = PayablesQuerySchema.parse(query);
  const targetCompany = parsed.empresa_id ?? context.companyId;

  if (targetCompany !== context.companyId) {
    return { items: [], pagination: { page: parsed.page, page_size: parsed.page_size, total: 0, total_pages: 0 } };
  }

  const fornecedor = parsed.fornecedor?.toLowerCase();
  const filtered = payables.filter((payable) => {
    if (payable.company_id !== context.companyId) return false;
    if (fornecedor && !payable.fornecedor_nome.toLowerCase().includes(fornecedor)) return false;
    if (parsed.status && !parsed.status.includes(payable.status)) return false;
    if (parsed.data_inicio && payable.data_vencimento < parsed.data_inicio) return false;
    if (parsed.data_fim && payable.data_vencimento > parsed.data_fim) return false;
    return true;
  });

  filtered.sort((left, right) => {
    const direction = parsed.sort_dir === 'asc' ? 1 : -1;
    const leftValue = left[parsed.sort_by];
    const rightValue = right[parsed.sort_by];
    return leftValue > rightValue ? direction : leftValue < rightValue ? -direction : 0;
  });

  const start = (parsed.page - 1) * parsed.page_size;
  const items = filtered.slice(start, start + parsed.page_size);

  return {
    items,
    pagination: {
      page: parsed.page,
      page_size: parsed.page_size,
      total: filtered.length,
      total_pages: Math.ceil(filtered.length / parsed.page_size),
    },
  };
}

export function createPayable(context: FinanceRequestContext, data: unknown) {
  const input = parseJsonObject(data);

  try {
    const validated = PayableSchema.parse({
      ...input,
      company_id: context.companyId,
      created_by: context.userId,
      created_at: now(),
      id: crypto.randomUUID(),
    });

    payables.push(validated);
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) throw normalizeZodError(error);
    throw error;
  }
}

export function approvePayable(context: FinanceRequestContext, id: string, data: unknown) {
  const input = parseJsonObject(data);
  const role = (input as { role?: string }).role;

  if (!role) {
    throw new FinanceValidationError('Role is required for approval.', 400);
  }

  const payable = payables.find((item) => item.id === id && item.company_id === context.companyId);
  if (!payable) throw new Error('Payable not found');

  if (payable.status === 'aprovado' || payable.status === 'pago') {
    return Response.json({ code: 'CONFLICT', message: 'Already approved' }, { status: 409 });
  }

  if (payable.status === 'rejeitado' || payable.status === 'cancelado') {
    throw new FinanceValidationError('Cannot approve a rejected or cancelled payable.', 422);
  }

  const threshold = approvalThresholds.find(
    (t) => t.company_id === context.companyId && t.role === role && payable.amount >= t.valor_minimo && payable.amount <= t.valor_maximo,
  );

  if (!threshold) {
    throw new FinanceValidationError('Insufficient approval authority for this amount.', 422);
  }

  payable.status = 'aprovado';
  payable.aprovado_por = context.userId;
  payable.aprovado_em = now();

  return payable;
}

export function listCostCenters(context: FinanceRequestContext): CostCenterNode[] {
  const companyCenters = costCenters.filter((cc) => cc.company_id === context.companyId && cc.ativo);

  function buildTree(parentId?: string): CostCenterNode[] {
    return companyCenters
      .filter((cc) => cc.parent_id === parentId)
      .map((cc) => ({
        id: cc.id ?? '',
        company_id: cc.company_id,
        nome: cc.nome,
        descricao: cc.descricao ?? '',
        ativo: cc.ativo ?? true,
        created_at: cc.created_at ?? '',
        children: buildTree(cc.id),
        gasto_mes: calculateCostCenterSpend(cc.id ?? ''),
      }));
  }

  return buildTree(undefined);
}

function calculateCostCenterSpend(costCenterId: string): number {
  const currentMonth = now().slice(0, 7);
  return payables
    .filter((p) => p.centro_custo_id === costCenterId && p.status === 'pago' && p.data_pagamento?.startsWith(currentMonth))
    .reduce((sum, p) => sum + p.amount, 0);
}

export function getProfitLoss(context: FinanceRequestContext, empresaId: string): ProfitLoss {
  if (empresaId !== context.companyId) {
    throw new FinanceValidationError('Cannot query P&L for another company.', 422);
  }

  const companyReceivables = receivables.filter((r) => r.company_id === empresaId && r.status === 'recebido');
  const companyPayables = payables.filter((p) => p.company_id === empresaId && p.status === 'pago');

  const receita = companyReceivables.reduce((sum, r) => sum + r.amount, 0);
  const despesas = companyPayables.reduce((sum, p) => sum + p.amount, 0);
  const lucro = receita - despesas;

  const historico_6m = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const mes = date.toISOString().slice(0, 7);

    const mesReceita = companyReceivables
      .filter((r) => r.received_date?.startsWith(mes))
      .reduce((sum, r) => sum + r.amount, 0);

    const mesDespesas = companyPayables
      .filter((p) => p.data_pagamento?.startsWith(mes))
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      mes,
      receita: mesReceita,
      despesas: mesDespesas,
      lucro: mesReceita - mesDespesas,
    };
  }).reverse();

  return {
    empresa_id: empresaId,
    receita,
    despesas,
    lucro,
    historico_6m,
    variacao_orcamento: 0,
  };
}

export function processFinancialEvent(context: FinanceRequestContext, data: unknown) {
  let payload: FinancialEvent;
  try {
    payload = FinancialEventSchema.parse(parseJsonObject(data));
  } catch (error) {
    if (error instanceof z.ZodError) throw normalizeZodError(error);
    throw error;
  }

  if (payload.data.empresa_id !== context.companyId) {
    throw new FinanceValidationError('Payload company must match request company context.', 422);
  }

  const payable: Payable = {
    id: crypto.randomUUID(),
    company_id: payload.data.empresa_id,
    fornecedor_nome: payload.data.modulo_origem,
    descricao: payload.data.descricao,
    amount: payload.data.valor,
    currency: 'BRL',
    data_vencimento: payload.data.data_referencia,
    status: 'pendente',
    centro_custo_id: payload.data.centro_custo_id,
    recorrente: payload.data.recorrente,
    created_by: context.userId,
    created_at: now(),
  };

  payables.push(payable);
  return payable;
}

export function runReconciliation(context: FinanceRequestContext): ReconciliationJob {
  const job: ReconciliationJob = {
    id: crypto.randomUUID(),
    company_id: context.companyId,
    status: 'processing',
    progress: 0,
    total_items: 0,
    processed_items: 0,
    auto_matched: 0,
    pending_review: 0,
    unreconciled: 0,
    started_at: now(),
    created_at: now(),
  };

  reconciliationJobs.push(job);

  const companyReceivables = receivables.filter((r) => r.company_id === context.companyId && r.status === 'pendente');
  const companyPayables = payables.filter((p) => p.company_id === context.companyId && p.status === 'pendente');
  const totalItems = companyReceivables.length + companyPayables.length;

  job.total_items = totalItems;

  for (const receivable of companyReceivables) {
    const score = calculateMatchScore(receivable.amount, receivable.expected_date);
    const item: ReconciliationItem = {
      id: crypto.randomUUID(),
      company_id: context.companyId,
      bank_statement_id: receivable.id!,
      transaction_id: receivable.id,
      score,
      status: score >= 80 ? 'conciliado' : score >= 50 ? 'revisao' : 'pendente',
      match_details: { amount: receivable.amount, date: receivable.expected_date },
      created_at: now(),
    };

    reconciliationItems.push(item);
    job.processed_items++;

    if (score >= 80) {
      job.auto_matched++;
      receivable.status = 'recebido';
      receivable.received_date = now();
    } else if (score >= 50) {
      job.pending_review++;
    } else {
      job.unreconciled++;
    }
  }

  for (const payable of companyPayables) {
    const score = calculateMatchScore(payable.amount, payable.data_vencimento);
    const item: ReconciliationItem = {
      id: crypto.randomUUID(),
      company_id: context.companyId,
      bank_statement_id: payable.id!,
      transaction_id: payable.id,
      score,
      status: score >= 80 ? 'conciliado' : score >= 50 ? 'revisao' : 'pendente',
      match_details: { amount: payable.amount, date: payable.data_vencimento },
      created_at: now(),
    };

    reconciliationItems.push(item);
    job.processed_items++;

    if (score >= 80) {
      job.auto_matched++;
      payable.status = 'pago';
      payable.data_pagamento = now();
    } else if (score >= 50) {
      job.pending_review++;
    } else {
      job.unreconciled++;
    }
  }

  job.progress = 100;
  job.status = 'completed';
  job.completed_at = now();

  return job;
}

function calculateMatchScore(amount: number, date: string): number {
  const randomFactor = Math.random() * 40;
  const amountFactor = amount > 10000 ? 10 : 20;
  const dateFactor = date < now() ? 10 : 20;
  return Math.min(100, Math.floor(50 + randomFactor + amountFactor + dateFactor));
}

export function getReconciliationStatus(context: FinanceRequestContext, jobId: string): ReconciliationJob {
  const job = reconciliationJobs.find((j) => j.id === jobId && j.company_id === context.companyId);
  if (!job) throw new Error('Reconciliation job not found');
  return job;
}

export function listPendingReconciliation(context: FinanceRequestContext): ReconciliationItem[] {
  return reconciliationItems.filter((item) => item.company_id === context.companyId && (item.status === 'revisao' || item.status === 'pendente'));
}

export function approveReconciliationItem(context: FinanceRequestContext, id: string): ReconciliationItem {
  const item = reconciliationItems.find((i) => i.id === id && i.company_id === context.companyId);
  if (!item) throw new Error('Reconciliation item not found');

  if (item.status === 'conciliado') {
    throw new FinanceValidationError('Item already reconciled.', 409);
  }

  item.status = 'conciliado';
  item.reviewed_by = context.userId;
  item.reviewed_at = now();

  if (item.transaction_id) {
    const receivable = receivables.find((r) => r.id === item.transaction_id);
    if (receivable) {
      receivable.status = 'recebido';
      receivable.received_date = now();
    }

    const payable = payables.find((p) => p.id === item.transaction_id);
    if (payable) {
      payable.status = 'pago';
      payable.data_pagamento = now();
    }
  }

  return item;
}

export function rejectReconciliationItem(context: FinanceRequestContext, id: string): ReconciliationItem {
  const item = reconciliationItems.find((i) => i.id === id && i.company_id === context.companyId);
  if (!item) throw new Error('Reconciliation item not found');

  if (item.status === 'conciliado') {
    throw new FinanceValidationError('Cannot reject a reconciled item.', 409);
  }

  item.status = 'pendente';
  item.reviewed_by = context.userId;
  item.reviewed_at = now();

  return item;
}

export function createEntryFromReconciliation(context: FinanceRequestContext, id: string): Receivable | Payable {
  const item = reconciliationItems.find((i) => i.id === id && i.company_id === context.companyId);
  if (!item) throw new Error('Reconciliation item not found');

  if (item.status !== 'revisao' && item.status !== 'pendente') {
    throw new FinanceValidationError('Item must be in review or pending status to create entry.', 422);
  }

  const details = item.match_details as { amount?: number; date?: string };
  const amount = details.amount ?? 0;
  const date = details.date ?? now();

  const receivable: Receivable = {
    id: crypto.randomUUID(),
    company_id: context.companyId,
    partner_name: 'Manual Entry',
    amount,
    currency: 'BRL',
    expected_date: date,
    status: 'pendente',
    created_by: context.userId,
    created_at: now(),
  };

  receivables.push(receivable);

  item.status = 'conciliado';
  item.reviewed_by = context.userId;
  item.reviewed_at = now();
  item.transaction_id = receivable.id;

  return receivable;
}
