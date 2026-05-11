import { z } from 'zod';

export const CampaignStatusSchema = z.enum(['ativa', 'pausada', 'concluida', 'rascunho', 'agendada']);
export type CampaignStatus = z.infer<typeof CampaignStatusSchema>;

export const CampaignTipoSchema = z.enum(['awareness', 'leads', 'conversao', 'remarketing', 'institucional', 'produto']);
export type CampaignTipo = z.infer<typeof CampaignTipoSchema>;

export const CampaignSchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  nome: z.string().min(1),
  status: CampaignStatusSchema.default('rascunho'),
  tipo: CampaignTipoSchema,
  budget: z.number().positive(),
  gasto: z.number().min(0).default(0),
  roi: z.number().default(0),
  data_inicio: z.string(),
  data_fim: z.string().optional(),
  canal: z.string().min(1),
  responsavel: z.string().min(1),
  created_at: z.string().optional(),
});

export type Campaign = z.infer<typeof CampaignSchema>;

export const StrategyPilarSchema = z.enum(['conteudo', 'midia_paga', 'seo', 'social_media', 'email', 'influenciadores', 'eventos']);
export type StrategyPilar = z.infer<typeof StrategyPilarSchema>;

export const StrategySchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  nome: z.string().min(1),
  descricao: z.string().min(1),
  pilares: z.array(StrategyPilarSchema).min(1),
  ativa: z.boolean().default(true),
  created_at: z.string().optional(),
});

export type Strategy = z.infer<typeof StrategySchema>;

export const ContentTipoSchema = z.enum(['post', 'reels', 'story', 'video', 'blog', 'email', 'newsletter', 'ads']);
export type ContentTipo = z.infer<typeof ContentTipoSchema>;

export const PlataformaSchema = z.enum(['instagram', 'facebook', 'linkedin', 'tiktok', 'youtube', 'google', 'email', 'blog']);
export type Plataforma = z.infer<typeof PlataformaSchema>;

export const ContentStatusSchema = z.enum(['planejado', 'em_producao', 'aprovado', 'publicado', 'cancelado']);
export type ContentStatus = z.infer<typeof ContentStatusSchema>;

export const ContentCalendarSchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  data: z.string(),
  tipo: ContentTipoSchema,
  plataforma: PlataformaSchema,
  titulo: z.string().min(1),
  status: ContentStatusSchema.default('planejado'),
  responsavel: z.string().min(1),
  campanha_id: z.string().uuid().optional(),
  created_at: z.string().optional(),
});

export type ContentCalendar = z.infer<typeof ContentCalendarSchema>;

export const AnalyticsSnapshotSchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  periodo: z.string(),
  impressions: z.number().int().min(0),
  clicks: z.number().int().min(0),
  ctr: z.number().min(0),
  conversions: z.number().int().min(0),
  cac: z.number().min(0),
  ltv: z.number().min(0),
  created_at: z.string().optional(),
});

export type AnalyticsSnapshot = z.infer<typeof AnalyticsSnapshotSchema>;

export const MktDashboardKpisSchema = z.object({
  campanhas_ativas: z.number().int(),
  total_leads: z.number().int(),
  cac_medio: z.number(),
  ltv_medio: z.number(),
  roi_medio: z.number(),
  budget_total: z.number(),
  budget_gasto: z.number(),
  impressoes_total: z.number().int(),
  cliques_total: z.number().int(),
  ctr_medio: z.number(),
  conversoes_total: z.number().int(),
  campanhas_por_status: z.array(z.object({ name: z.string(), value: z.number().int() })),
  campanhas_por_canal: z.array(z.object({ name: z.string(), value: z.number().int() })),
  evolucao_6m: z.array(z.object({
    mes: z.string(),
    impressoes: z.number().int(),
    cliques: z.number().int(),
    conversoes: z.number().int(),
    gasto: z.number(),
  })),
});

export type MktDashboardKpis = z.infer<typeof MktDashboardKpisSchema>;

export const CampaignsQuerySchema = z.object({
  status: z.array(CampaignStatusSchema).optional(),
  tipo: z.array(CampaignTipoSchema).optional(),
  canal: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().positive().max(100).default(10),
  sort_by: z.enum(['nome', 'budget', 'roi', 'data_inicio', 'status']).default('data_inicio'),
  sort_dir: z.enum(['asc', 'desc']).default('desc'),
});

export type CampaignsQuery = z.infer<typeof CampaignsQuerySchema>;
