import { z } from 'zod';

export interface FinanceKpi {
  id: string;
  label: string;
  value: string;
  detail: string;
}

export interface FinanceModule {
  id: string;
  icon: string;
  title: string;
  description: string;
  href: string;
}

export type FinanceAgentStatus = 'online' | 'offline' | 'scheduled';

export interface FinanceAgentSlot {
  id: string;
  name: string;
  role: string;
  cadence: string;
  status: FinanceAgentStatus;
}

export interface FinanceIntegration {
  id: string;
  source: string;
  flow: string;
  visibility: string;
}

export interface FinanceApprovalLimit {
  id: string;
  range: string;
  approver: string;
  note: string;
}

export interface FinanceGovernanceRole {
  id: string;
  role: string;
  responsibility: string;
}

export const FinanceStatusSchema = z.enum(['pendente', 'recebido', 'atrasado', 'divergente']);
export type FinanceStatus = z.infer<typeof FinanceStatusSchema>;

export const ReceivableSchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  parceiro_id: z.string().uuid().optional(),
  partner_name: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().default('BRL'),
  expected_date: z.string(), // ISO date
  received_date: z.string().optional(),
  status: FinanceStatusSchema.default('pendente'),
  statement_ref: z.string().optional(),
  created_by: z.string().optional(),
  created_at: z.string().optional(),
});

export type Receivable = z.infer<typeof ReceivableSchema>;

export const DashboardKpisSchema = z.object({
  receita_total: z.number(),
  a_receber: z.number(),
  atrasados: z.number(),
  divergencias: z.number(),
  projecao_30d: z.number().nullable(),
  delta_percentual: z.number(),
  receita_por_parceiro: z.array(z.object({ name: z.string(), value: z.number() })),
  receita_por_empresa: z.array(z.object({ name: z.string(), value: z.number() })),
});

export type DashboardKpis = z.infer<typeof DashboardKpisSchema>;

export const ReceivablesQuerySchema = z.object({
  parceiro: z.string().optional(),
  status: z.array(FinanceStatusSchema).optional(),
  data_inicio: z.string().optional(),
  data_fim: z.string().optional(),
  empresa_id: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().positive().max(100).default(10),
  sort_by: z.enum(['partner_name', 'amount', 'expected_date', 'status']).default('expected_date'),
  sort_dir: z.enum(['asc', 'desc']).default('asc'),
});

export type ReceivablesQuery = z.infer<typeof ReceivablesQuerySchema>;

export const SalesIntakeSchema = z.object({
  event: z.literal('payment.received'),
  data: z.object({
    parceiro_id: z.string().uuid(),
    parceiro_nome: z.string(),
    empresa_id: z.string().uuid(),
    valor: z.number().positive(),
    moeda: z.string().default('BRL'),
    periodo_ref: z.string(), // YYYY-MM
    data_recebimento: z.string(), // ISO8601
    tipo_parceria: z.string(),
    comprovante_path: z.string().optional(),
    notas: z.string().optional(),
  }),
});

export type SalesIntake = z.infer<typeof SalesIntakeSchema>;

export const PayableStatusSchema = z.enum(['pendente', 'aprovado', 'pago', 'rejeitado', 'cancelado']);
export type PayableStatus = z.infer<typeof PayableStatusSchema>;

export const PayableSchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  fornecedor_id: z.string().uuid().optional(),
  fornecedor_nome: z.string().min(1),
  descricao: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().default('BRL'),
  data_vencimento: z.string(),
  data_pagamento: z.string().optional(),
  status: PayableStatusSchema.default('pendente'),
  centro_custo_id: z.string().uuid().optional(),
  aprovado_por: z.string().uuid().optional(),
  aprovado_em: z.string().optional(),
  recorrente: z.boolean().default(false),
  recorrencia_frequencia: z.string().optional(),
  created_by: z.string().uuid().optional(),
  created_at: z.string().optional(),
});

export type Payable = z.infer<typeof PayableSchema>;

export const PayablesQuerySchema = z.object({
  fornecedor: z.string().optional(),
  status: z.array(PayableStatusSchema).optional(),
  data_inicio: z.string().optional(),
  data_fim: z.string().optional(),
  empresa_id: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().positive().max(100).default(10),
  sort_by: z.enum(['fornecedor_nome', 'amount', 'data_vencimento', 'status']).default('data_vencimento'),
  sort_dir: z.enum(['asc', 'desc']).default('asc'),
});

export type PayablesQuery = z.infer<typeof PayablesQuerySchema>;

export const CostCenterSchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  nome: z.string().min(1),
  descricao: z.string().optional(),
  parent_id: z.string().uuid().optional(),
  nivel: z.number().int().min(1).max(3).default(1),
  ativo: z.boolean().default(true),
  created_at: z.string().optional(),
});

export type CostCenter = z.infer<typeof CostCenterSchema>;

export interface CostCenterNode {
  id: string;
  company_id: string;
  nome: string;
  descricao: string;
  ativo: boolean;
  created_at: string;
  children: CostCenterNode[];
  gasto_mes: number;
}

export const ProfitLossSchema = z.object({
  empresa_id: z.string().uuid(),
  receita: z.number(),
  despesas: z.number(),
  lucro: z.number(),
  historico_6m: z.array(z.object({
    mes: z.string(),
    receita: z.number(),
    despesas: z.number(),
    lucro: z.number(),
  })),
  variacao_orcamento: z.number().optional(),
});

export type ProfitLoss = z.infer<typeof ProfitLossSchema>;

export const ApprovalRoleSchema = z.enum(['cfo', 'gestor', 'analista', 'auditor', 'owner']);
export type ApprovalRole = z.infer<typeof ApprovalRoleSchema>;

export const ApprovalThresholdSchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  role: ApprovalRoleSchema,
  valor_minimo: z.number().min(0),
  valor_maximo: z.number().positive(),
  created_at: z.string().optional(),
});

export type ApprovalThreshold = z.infer<typeof ApprovalThresholdSchema>;

export const FinancialEventSchema = z.object({
  event: z.literal('financial.event'),
  data: z.object({
    tipo_custo: z.string(),
    descricao: z.string(),
    valor: z.number().positive(),
    empresa_id: z.string().uuid(),
    centro_custo_id: z.string().uuid().optional(),
    recorrente: z.boolean().default(false),
    data_referencia: z.string(),
    modulo_origem: z.string(),
  }),
});

export type FinancialEvent = z.infer<typeof FinancialEventSchema>;

export const ReconciliationStatusSchema = z.enum(['pendente', 'conciliado', 'divergente', 'revisao']);
export type ReconciliationStatus = z.infer<typeof ReconciliationStatusSchema>;

export const ReconciliationItemSchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  bank_statement_id: z.string().uuid(),
  transaction_id: z.string().uuid().optional(),
  score: z.number().int().min(0).max(100),
  status: ReconciliationStatusSchema.default('pendente'),
  match_details: z.record(z.unknown()).optional(),
  reviewed_by: z.string().uuid().optional(),
  reviewed_at: z.string().optional(),
  created_at: z.string().optional(),
});

export type ReconciliationItem = z.infer<typeof ReconciliationItemSchema>;

export const ReconciliationJobSchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  status: z.enum(['processing', 'completed', 'failed']).default('processing'),
  progress: z.number().int().min(0).max(100).default(0),
  total_items: z.number().int().min(0).default(0),
  processed_items: z.number().int().min(0).default(0),
  auto_matched: z.number().int().min(0).default(0),
  pending_review: z.number().int().min(0).default(0),
  unreconciled: z.number().int().min(0).default(0),
  started_at: z.string().optional(),
  completed_at: z.string().optional(),
  error_message: z.string().optional(),
  created_at: z.string().optional(),
});

export type ReconciliationJob = z.infer<typeof ReconciliationJobSchema>;
