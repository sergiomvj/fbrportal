import { z } from 'zod';
import { createSupabaseServerClient } from '../supabase-admin';
import type {
  Receivable,
  Payable,
  CostCenter,
  ReconciliationItem,
  ReconciliationJob,
  ReceivablesQuery,
  PayablesQuery,
  FinanceStatus,
  DashboardKpis,
} from './types';

export interface FinanceRequestContext {
  companyId: string;
  userId: string;
  moduleSource: string;
}

export class FinanceDbValidationError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 404 | 409 | 422,
    readonly issues?: unknown,
  ) {
    super(message);
  }
}

const COMPANY_ALPHA = '11111111-1111-4111-8111-111111111111';
const USER_SYSTEM = '33333333-3333-4333-8333-333333333333';

function now() {
  return new Date().toISOString();
}

export function getFinanceTestCompanyIds() {
  return { alpha: COMPANY_ALPHA, user: USER_SYSTEM };
}

export function contextFromHeaders(headers: Headers, fallbackModuleSource = 'finance'): FinanceRequestContext | Response {
  const userId = headers.get('x-user-id');
  const companyId = headers.get('x-company-id') ?? headers.get('x-workspace-id') ?? headers.get('x-empresa-id');
  const moduleSource = headers.get('x-module-source') ?? fallbackModuleSource;

  if (!userId || !companyId) {
    return Response.json({ success: false, error: { code: 'UNAUTHORIZED_CONTEXT', message: 'X-User-Id and company headers are required.' } }, { status: 401 });
  }

  const companyCheck = z.string().uuid().safeParse(companyId);
  if (!companyCheck.success) {
    return Response.json({ success: false, error: { code: 'INVALID_COMPANY', message: 'Company header must be a valid UUID.' } }, { status: 422 });
  }

  return { userId, companyId, moduleSource };
}

export async function listReceivablesDb(context: FinanceRequestContext, query: Partial<ReceivablesQuery> = {}) {
  const supabase = createSupabaseServerClient();

  let q = supabase.from('finance_receivables').select('*', { count: 'exact' }).eq('company_id', context.companyId);

  if (query.parceiro) {
    q = q.ilike('partner_name', `%${query.parceiro}%`);
  }

  if (query.status && query.status.length > 0) {
    q = q.in('status', query.status);
  }

  if (query.data_inicio) {
    q = q.gte('expected_date', query.data_inicio);
  }

  if (query.data_fim) {
    q = q.lte('expected_date', query.data_fim);
  }

  q = q.order(query.sort_by ?? 'created_at', { ascending: query.sort_dir === 'asc' });

  const page = typeof query.page === 'number' ? query.page : (parseInt(String(query.page ?? '1')) || 1);
  const pageSize = typeof query.page_size === 'number' ? query.page_size : (parseInt(String(query.page_size ?? '20')) || 20);
  const start = (page - 1) * pageSize;
  q = q.range(start, start + pageSize - 1);

  const { data, error, count } = await q;

  if (error) throw new Error(error.message);

  return {
    items: data as Receivable[],
    pagination: {
      page,
      page_size: pageSize,
      total: count || 0,
      total_pages: Math.ceil((count || 0) / pageSize),
    },
  };
}

export async function createReceivableDb(context: FinanceRequestContext, data: unknown): Promise<Receivable> {
  const supabase = createSupabaseServerClient();
  const input = data as Record<string, unknown>;

  const validated = {
    company_id: context.companyId,
    created_by: context.userId,
    parceiro_id: input.parceiro_id as string | undefined,
    partner_name: input.partner_name as string,
    amount: input.amount as number,
    currency: (input.currency as string) || 'BRL',
    expected_date: input.expected_date as string,
    status: (input.status as string) || 'pendente',
    statement_ref: input.statement_ref as string | undefined,
    created_at: now(),
  };

  const { data: receivable, error } = await supabase.from('finance_receivables').insert(validated).select().single();

  if (error) throw new Error(error.message);

  return receivable as Receivable;
}

export async function reconcileReceivableDb(context: FinanceRequestContext, id: string, data: unknown): Promise<Receivable> {
  const supabase = createSupabaseServerClient();
  const input = data as Record<string, unknown>;
  const amountReceived = input.amount_received as number;

  const { data: existing } = await supabase.from('finance_receivables').select('*').eq('id', id).eq('company_id', context.companyId).single();

  if (!existing) {
    throw new FinanceDbValidationError('Receivable not found.', 404);
  }

  if (existing.status === 'recebido' || existing.status === 'divergente') {
    throw new FinanceDbValidationError('Already reconciled', 409);
  }

  const status: FinanceStatus = Math.abs(existing.amount - amountReceived) / existing.amount <= 0.05 ? 'recebido' : 'divergente';

  const { data: updated, error } = await supabase.from('finance_receivables').update({
    status,
    received_date: now().slice(0, 10),
  }).eq('id', id).eq('company_id', context.companyId).select().single();

  if (error) throw new Error(error.message);

  return updated as Receivable;
}

export async function getDashboardKpisDb(context: FinanceRequestContext): Promise<DashboardKpis> {
  const supabase = createSupabaseServerClient();

  const { data: receivables } = await supabase.from('finance_receivables').select('*').eq('company_id', context.companyId);

  const received = receivables?.filter(r => r.status === 'recebido') || [];
  const pending = receivables?.filter(r => r.status === 'pendente') || [];
  const today = now().slice(0, 10);
  const inThirtyDaysDate = new Date();
  inThirtyDaysDate.setDate(inThirtyDaysDate.getDate() + 30);
  const inThirtyDays = inThirtyDaysDate.toISOString().slice(0, 10);

  const receitaTotal = received.reduce((sum, r) => sum + r.amount, 0);
  const aReceber = pending.reduce((sum, r) => sum + r.amount, 0);
  const atrasados = receivables?.filter(r => r.status === 'atrasado' || (r.status === 'pendente' && r.expected_date < today)).length || 0;
  const divergencias = receivables?.filter(r => r.status === 'divergente').length || 0;
  const projecao30d = pending.filter(r => r.expected_date >= today && r.expected_date <= inThirtyDays).reduce((sum, r) => sum + r.amount, 0);

  const receitaPorParceiro = received.reduce((acc, r) => {
    acc[r.partner_name] = (acc[r.partner_name] || 0) + r.amount;
    return acc;
  }, {} as Record<string, number>);

  return {
    receita_total: Number(receitaTotal.toFixed(2)),
    a_receber: Number(aReceber.toFixed(2)),
    atrasados,
    divergencias,
    projecao_30d: Number(projecao30d.toFixed(2)),
    delta_percentual: 0,
    receita_por_parceiro: (Object.entries(receitaPorParceiro) as [string, number][]).map(([name, value]) => ({ name, value: Number(value.toFixed(2)) })),
    receita_por_empresa: [{ name: context.companyId, value: Number(receitaTotal.toFixed(2)) }],
  };
}

export async function listPayablesDb(context: FinanceRequestContext, query: Partial<PayablesQuery> = {}) {
  const supabase = createSupabaseServerClient();

  let q = supabase.from('finance_payables').select('*', { count: 'exact' }).eq('company_id', context.companyId);

  if (query.fornecedor) {
    q = q.ilike('fornecedor_nome', `%${query.fornecedor}%`);
  }

  if (query.status && query.status.length > 0) {
    q = q.in('status', query.status);
  }

  if (query.data_inicio) {
    q = q.gte('data_vencimento', query.data_inicio);
  }

  if (query.data_fim) {
    q = q.lte('data_vencimento', query.data_fim);
  }

  q = q.order(query.sort_by ?? 'created_at', { ascending: query.sort_dir === 'asc' });

  const page = typeof query.page === 'number' ? query.page : (parseInt(String(query.page ?? '1')) || 1);
  const pageSize = typeof query.page_size === 'number' ? query.page_size : (parseInt(String(query.page_size ?? '20')) || 20);
  const start = (page - 1) * pageSize;
  q = q.range(start, start + pageSize - 1);

  const { data, error, count } = await q;

  if (error) throw new Error(error.message);

  return {
    items: data as Payable[],
    pagination: {
      page,
      page_size: pageSize,
      total: count || 0,
      total_pages: Math.ceil((count || 0) / pageSize),
    },
  };
}

export async function createPayableDb(context: FinanceRequestContext, data: unknown): Promise<Payable> {
  const supabase = createSupabaseServerClient();
  const input = data as Record<string, unknown>;

  const validated = {
    company_id: context.companyId,
    created_by: context.userId,
    fornecedor_nome: input.fornecedor_nome as string,
    descricao: input.descricao as string | undefined,
    amount: input.amount as number,
    currency: (input.currency as string) || 'BRL',
    data_vencimento: input.data_vencimento as string,
    status: (input.status as string) || 'pendente',
    recorrente: input.recorrente as boolean | undefined,
    recorrencia_frequencia: input.recorrencia_frequencia as string | undefined,
    centro_custo_id: input.centro_custo_id as string | undefined,
    created_at: now(),
  };

  const { data: payable, error } = await supabase.from('finance_payables').insert(validated).select().single();

  if (error) throw new Error(error.message);

  return payable as Payable;
}

export async function approvePayableDb(context: FinanceRequestContext, id: string, data: unknown): Promise<Payable> {
  const supabase = createSupabaseServerClient();
  const input = data as Record<string, unknown>;
  const decisao = (input.decisao as string) || 'aprovar';

  const { data: existing } = await supabase.from('finance_payables').select('*').eq('id', id).eq('company_id', context.companyId).single();

  if (!existing) {
    throw new FinanceDbValidationError('Payable not found.', 404);
  }

  if (existing.status === 'aprovado' || existing.status === 'pago') {
    throw new FinanceDbValidationError('Already approved.', 409);
  }

  if (decisao === 'rejeitar') {
    const { data: updated, error } = await supabase.from('finance_payables').update({
      status: 'rejeitado',
      aprovado_por: context.userId,
      aprovado_em: now(),
    }).eq('id', id).eq('company_id', context.companyId).select().single();

    if (error) throw new Error(error.message);
    return updated as Payable;
  }

  const { data: updated, error } = await supabase.from('finance_payables').update({
    status: 'aprovado',
    aprovado_por: context.userId,
    aprovado_em: now(),
  }).eq('id', id).eq('company_id', context.companyId).select().single();

  if (error) throw new Error(error.message);

  return updated as Payable;
}

export async function listCostCentersDb(context: FinanceRequestContext): Promise<CostCenter[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from('finance_cost_centers').select('*').eq('company_id', context.companyId).eq('ativo', true);

  if (error) throw new Error(error.message);

  return (data as CostCenter[]) || [];
}

export async function createReconciliationJobDb(context: FinanceRequestContext): Promise<ReconciliationJob> {
  const supabase = createSupabaseServerClient();

  const job = {
    company_id: context.companyId,
    status: 'processing' as const,
    progress: 0,
    total_items: 0,
    processed_items: 0,
    auto_matched: 0,
    pending_review: 0,
    unreconciled: 0,
    started_at: now(),
    created_at: now(),
  };

  const { data, error } = await supabase.from('finance_reconciliation_jobs').insert(job).select().single();

  if (error) throw new Error(error.message);

  return data as ReconciliationJob;
}

export async function updateReconciliationJobDb(
  context: FinanceRequestContext,
  jobId: string,
  updates: {
    status?: string;
    progress?: number;
    total_items?: number;
    processed_items?: number;
    auto_matched?: number;
    pending_review?: number;
    unreconciled?: number;
    completed_at?: string;
  }
): Promise<ReconciliationJob> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from('finance_reconciliation_jobs').update(updates).eq('id', jobId).eq('company_id', context.companyId).select().single();

  if (error) throw new Error(error.message);

  return data as ReconciliationJob;
}

export async function getReconciliationJobDb(context: FinanceRequestContext, jobId: string): Promise<ReconciliationJob> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from('finance_reconciliation_jobs').select('*').eq('id', jobId).eq('company_id', context.companyId).single();

  if (error || !data) {
    throw new FinanceDbValidationError('Reconciliation job not found.', 404);
  }

  return data as ReconciliationJob;
}

export async function createReconciliationItemDb(context: FinanceRequestContext, item: {
  bank_statement_id: string;
  transaction_id?: string;
  score: number;
  status: string;
  match_details: Record<string, unknown>;
}): Promise<ReconciliationItem> {
  const supabase = createSupabaseServerClient();

  const rec = {
    company_id: context.companyId,
    bank_statement_id: item.bank_statement_id,
    transaction_id: item.transaction_id || null,
    score: item.score,
    status: item.status,
    match_details: item.match_details as object,
    created_at: now(),
  };

  const { data, error } = await supabase.from('finance_reconciliation_items').insert(rec).select().single();

  if (error) throw new Error(error.message);

  return data as ReconciliationItem;
}

export async function listReconciliationItemsDb(context: FinanceRequestContext, statusFilter?: string[]): Promise<ReconciliationItem[]> {
  const supabase = createSupabaseServerClient();

  let q = supabase.from('finance_reconciliation_items').select('*').eq('company_id', context.companyId);

  if (statusFilter && statusFilter.length > 0) {
    q = q.in('status', statusFilter);
  }

  const { data, error } = await q;

  if (error) throw new Error(error.message);

  return (data as ReconciliationItem[]) || [];
}

export async function approveReconciliationItemDb(context: FinanceRequestContext, id: string): Promise<ReconciliationItem> {
  const supabase = createSupabaseServerClient();

  const { data: updated, error } = await supabase.from('finance_reconciliation_items').update({
    status: 'conciliado',
    reviewed_by: context.userId,
    reviewed_at: now(),
  }).eq('id', id).eq('company_id', context.companyId).select().single();

  if (error) throw new Error(error.message);

  return updated as ReconciliationItem;
}

export async function rejectReconciliationItemDb(context: FinanceRequestContext, id: string, observacao?: string): Promise<ReconciliationItem> {
  const supabase = createSupabaseServerClient();

  const update: Record<string, unknown> = {
    status: 'pendente',
    reviewed_by: context.userId,
    reviewed_at: now(),
  };

  if (observacao) {
    update.match_details = { observacao_rejeicao: observacao };
  }

  const { data: updated, error } = await supabase.from('finance_reconciliation_items').update(update).eq('id', id).eq('company_id', context.companyId).select().single();

  if (error) throw new Error(error.message);

  return updated as ReconciliationItem;
}

export async function getProfitLossDb(context: FinanceRequestContext, empresaId: string) {
  const supabase = createSupabaseServerClient();

  const { data: receivables } = await supabase.from('finance_receivables').select('*').eq('company_id', empresaId).eq('status', 'recebido');
  const { data: payables } = await supabase.from('finance_payables').select('*').eq('company_id', empresaId).eq('status', 'pago');

  const receita = (receivables || []).reduce((sum, r) => sum + r.amount, 0);
  const despesas = (payables || []).reduce((sum, p) => sum + p.amount, 0);

  return {
    empresa_id: empresaId,
    receita,
    despesas,
    lucro: receita - despesas,
    historico_6m: [],
    variacao_orcamento: 0,
  };
}