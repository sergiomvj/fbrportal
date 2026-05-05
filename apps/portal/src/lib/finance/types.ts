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
