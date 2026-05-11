import { z } from 'zod';

export const PartnerStageSchema = z.enum([
  'prospect',
  'negociacao',
  'contract',
  'onboarding',
  'active',
  'paused',
  'encerrado',
]);
export type PartnerStage = z.infer<typeof PartnerStageSchema>;

export const VALID_TRANSITIONS: Record<PartnerStage, PartnerStage[]> = {
  prospect: ['negociacao', 'encerrado'],
  negociacao: ['contract', 'prospect', 'encerrado'],
  contract: ['onboarding', 'negociacao', 'encerrado'],
  onboarding: ['active', 'encerrado'],
  active: ['paused', 'encerrado'],
  paused: ['active', 'encerrado'],
  encerrado: [],
};

export const PartnerTypeSchema = z.enum([
  'ad_network',
  'agencia',
  'anunciante',
  'produtor_conteudo',
  'patrocinio_direto',
]);
export type PartnerType = z.infer<typeof PartnerTypeSchema>;

export const AdNetworkProviderSchema = z.enum([
  'google_adsense',
  'google_gam',
  'taboola',
  'outbrain',
  'mgid',
  'ezoic',
  'mediavine',
  'youtube_partner',
]);
export type AdNetworkProvider = z.infer<typeof AdNetworkProviderSchema>;

export const PartnerSchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  nome: z.string().min(1),
  tipo: PartnerTypeSchema,
  ad_network: AdNetworkProviderSchema.optional(),
  estagio: PartnerStageSchema.default('prospect'),
  contato_nome: z.string().optional(),
  contato_email: z.string().email().optional(),
  contato_telefone: z.string().optional(),
  site: z.string().url().optional(),
  cnpj: z.string().optional(),
  cpf: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  pais: z.string().default('Brasil'),
  valor_estimado: z.number().positive().optional(),
  sla_pagamento: z.number().int().positive().default(30),
  data_contrato: z.string().optional(),
  data_vencimento_contrato: z.string().optional(),
  valor_contrato: z.number().positive().optional(),
  observacoes: z.string().optional(),
  owner_id: z.string().uuid().optional(),
  created_by: z.string().uuid().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type Partner = z.infer<typeof PartnerSchema>;

export const PartnerEventTypeSchema = z.enum([
  'transicao_estagio',
  'documento_anexado',
  'proposta_enviada',
  'proposta_aceita',
  'proposta_rejeitada',
  'contrato_assinado',
  'pagamento_recebido',
  'onboarding_iniciado',
  'onboarding_concluido',
  'sla_violado',
  'anomalia_detectada',
  'pausa_iniciada',
  'pausa_encerrada',
  'parceiro_encerrado',
  'nota_adicionada',
]);
export type PartnerEventType = z.infer<typeof PartnerEventTypeSchema>;

export const ActorTypeSchema = z.enum(['humano', 'agente', 'sistema']);
export type ActorType = z.infer<typeof ActorTypeSchema>;

export const PartnerEventSchema = z.object({
  id: z.string().uuid().optional(),
  partner_id: z.string().uuid(),
  tipo: PartnerEventTypeSchema,
  de: PartnerStageSchema.optional(),
  para: PartnerStageSchema.optional(),
  actor_type: ActorTypeSchema.default('humano'),
  actor_id: z.string().uuid().optional(),
  actor_nome: z.string().optional(),
  descricao: z.string().min(1),
  metadata: z.record(z.unknown()).optional(),
  created_at: z.string().optional(),
});
export type PartnerEvent = z.infer<typeof PartnerEventSchema>;

export const EspacoPublicitarioSchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  produto_id: z.string().uuid().optional(),
  produto_nome: z.string().optional(),
  nome: z.string().min(1),
  tipo: z.enum(['banner', 'video', 'native', 'audio', 'newsletter', 'podcast', 'sponsored_content']),
  posicao: z.string().optional(),
  dimensao_largura: z.number().int().positive().optional(),
  dimensao_altura: z.number().int().positive().optional(),
  cpm_base: z.number().positive().default(0),
  ocupacao: z.number().min(0).max(100).default(0),
  demanda: z.enum(['baixa', 'normal', 'alta']).default('normal'),
  cpm_dinamico: z.number().positive().optional(),
  ativo: z.boolean().default(true),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type EspacoPublicitario = z.infer<typeof EspacoPublicitarioSchema>;

export const ReceitaStatusSchema = z.enum(['pendente', 'reconciliado', 'anomalia']);
export type ReceitaStatus = z.infer<typeof ReceitaStatusSchema>;

export const ReceitaSchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  parceiro_id: z.string().uuid(),
  periodo_ref: z.string().regex(/^\d{4}-\d{2}$/),
  valor_esperado: z.number().positive(),
  valor_recebido: z.number().optional(),
  status: ReceitaStatusSchema.default('pendente'),
  data_esperada: z.string().optional(),
  data_recebimento: z.string().optional(),
  divergencia_percentual: z.number().optional(),
  observacoes: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type Receita = z.infer<typeof ReceitaSchema>;

export const AnomalyTypeSchema = z.enum([
  'valor_divergente',
  'atraso_pagamento',
  'padrao_incomum',
  'duplicata',
  'ausencia_dados',
  'sazonalidade',
]);
export type AnomalyType = z.infer<typeof AnomalyTypeSchema>;

export const AnomalySeveritySchema = z.enum(['critica', 'alta', 'media', 'baixa']);
export type AnomalySeverity = z.infer<typeof AnomalySeveritySchema>;

export const AnomalyStatusSchema = z.enum(['pendente_revisao', 'aprovada', 'rejeitada']);
export type AnomalyStatus = z.infer<typeof AnomalyStatusSchema>;

export const AnomalySchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  receita_id: z.string().uuid().optional(),
  parceiro_id: z.string().uuid(),
  tipo: AnomalyTypeSchema,
  descricao: z.string().min(1),
  severidade: AnomalySeveritySchema,
  score: z.number().int().min(0),
  metadata: z.record(z.unknown()).optional(),
  status: AnomalyStatusSchema.default('pendente_revisao'),
  revisao_observacao: z.string().optional(),
  revisado_por: z.string().uuid().optional(),
  revisado_em: z.string().optional(),
  created_at: z.string().optional(),
});
export type Anomaly = z.infer<typeof AnomalySchema>;

export const MediaKitStatusSchema = z.enum(['gerando', 'concluido', 'erro']);
export type MediaKitStatus = z.infer<typeof MediaKitStatusSchema>;

export const MediaKitSchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  produto_id: z.string().uuid(),
  produto_nome: z.string().optional(),
  periodo_inicio: z.string(),
  periodo_fim: z.string(),
  status: MediaKitStatusSchema.default('gerando'),
  download_url: z.string().url().optional(),
  share_url: z.string().url().optional(),
  share_expira_em: z.string().optional(),
  erro: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type MediaKit = z.infer<typeof MediaKitSchema>;

export const RateCardSchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  espaco_id: z.string().uuid(),
  nome: z.string().min(1),
  cpm: z.number().positive(),
  modelo: z.enum(['cpm', 'cpc', 'rpm', 'fixed']),
  validade_inicio: z.string().optional(),
  validade_fim: z.string().optional(),
  ativo: z.boolean().default(true),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type RateCard = z.infer<typeof RateCardSchema>;

export const ApiKeySchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  produto_id: z.string().uuid(),
  key: z.string().uuid(),
  permissoes: z.array(z.enum(['read_inventory', 'create_campaign', 'read_metrics'])),
  rate_limit: z.number().int().positive().default(60),
  ativo: z.boolean().default(true),
  created_at: z.string().optional(),
  expires_at: z.string().optional(),
});
export type ApiKey = z.infer<typeof ApiKeySchema>;

export const CampaignSchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  espaco_id: z.string().uuid(),
  nome: z.string().min(1),
  status: z.enum(['pendente_aprovacao', 'ativa', 'pausada', 'reprovada', 'encerrada']),
  budget: z.number().positive().optional(),
  criativo_aprovado: z.boolean().default(false),
  criativo_url: z.string().url().optional(),
  criativo_reprovado_motivo: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type Campaign = z.infer<typeof CampaignSchema>;

export const PartnersQuerySchema = z.object({
  busca: z.string().optional(),
  estagio: z.array(PartnerStageSchema).optional(),
  tipo: z.array(PartnerTypeSchema).optional(),
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().positive().max(100).default(20),
  sort_by: z.enum(['nome', 'estagio', 'valor_estimado', 'created_at']).default('created_at'),
  sort_dir: z.enum(['asc', 'desc']).default('desc'),
});
export type PartnersQuery = z.infer<typeof PartnersQuerySchema>;

export const DashboardKpisSchema = z.object({
  revenue_total_mes: z.number(),
  revenue_total_mes_anterior: z.number(),
  revenue_variacao_percentual: z.number(),
  parcerias_por_estagio: z.record(z.number()),
  anomalias_pendentes: z.object({
    total: z.number(),
    critica: z.number(),
    alta: z.number(),
    media: z.number(),
  }),
  receita_forecast_proximo_mes: z.number(),
  parceiros_ativos: z.number(),
  parceiros_em_negociacao: z.number(),
  tickets_pendentes: z.number(),
  ocupacao_media: z.number(),
});
export type DashboardKpis = z.infer<typeof DashboardKpisSchema>;

export const TransitionStageBodySchema = z.object({
  para: PartnerStageSchema,
  descricao: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type TransitionStageBody = z.infer<typeof TransitionStageBodySchema>;

export const ReconciliationResultSchema = z.object({
  processadas: z.number(),
  reconciliadas: z.number(),
  anomalias_encontradas: z.number(),
  erros: z.array(z.string()).optional(),
});
export type ReconciliationResult = z.infer<typeof ReconciliationResultSchema>;

export const AnomalyReviewBodySchema = z.object({
  acao: z.enum(['aprovar', 'rejeitar', 'registrar_acao']),
  observacao: z.string().optional(),
});
export type AnomalyReviewBody = z.infer<typeof AnomalyReviewBodySchema>;

export const MediaKitCreateBodySchema = z.object({
  produto_id: z.string().uuid(),
  periodo_inicio: z.string(),
  periodo_fim: z.string(),
  formatos: z.array(z.string()).optional(),
});
export type MediaKitCreateBody = z.infer<typeof MediaKitCreateBodySchema>;