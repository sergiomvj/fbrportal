import { z } from 'zod';

export const MktJobCategorySchema = z.enum([
  'upload',
  'extracao',
  'geracao_estrategia',
  'copy',
  'calendario',
  'export',
  'fbr_click_delivery',
  'report_outputs',
]);
export type MktJobCategory = z.infer<typeof MktJobCategorySchema>;

export const MktJobStatusSchema = z.enum([
  'pending',
  'processing',
  'done',
  'failed',
]);
export type MktJobStatus = z.infer<typeof MktJobStatusSchema>;

export const MktEstrategiaStatusSchema = z.enum([
  'processando',
  'revisao',
  'ativa',
  'arquivada',
]);
export type MktEstrategiaStatus = z.infer<typeof MktEstrategiaStatusSchema>;

export const MktAvaliacaoStatusSchema = z.enum([
  'rascunho',
  'em_avaliacao',
  'aprovado',
  'rejeitado',
]);
export type MktAvaliacaoStatus = z.infer<typeof MktAvaliacaoStatusSchema>;


export const MktRoleSchema = z.enum(['Admin', 'Editor', 'Viewer']);
export type MktRole = z.infer<typeof MktRoleSchema>;

export const MktSseStageSchema = z.enum([
  'extracao',
  'analise',
  'geracao',
  'pronto',
]);
export type MktSseStage = z.infer<typeof MktSseStageSchema>;

export const MktSwotSchema = z.object({
  forcas: z.array(z.string()).min(1),
  fraquezas: z.array(z.string()).min(1),
  oportunidades: z.array(z.string()).min(1),
  ameacas: z.array(z.string()).min(1),
});
export type MktSwot = z.infer<typeof MktSwotSchema>;

export const MktPersonaSchema = z.object({
  nome: z.string(),
  idade: z.string(),
  profissao: z.string(),
  dores: z.array(z.string()),
  desejos: z.array(z.string()),
  comportamento_digital: z.string(),
  canais_preferidos: z.array(z.string()),
});
export type MktPersona = z.infer<typeof MktPersonaSchema>;

export const MktDiagnosticoSchema = z.object({
  id: z.string().uuid().optional(),
  estrategia_id: z.string().uuid(),
  swot: MktSwotSchema,
  persona: MktPersonaSchema,
  uvp: z.string(),
  score_viab: z.number().int().min(0).max(100),
  justificativa: z.string(),
  nicho: z.string().optional(),
  budget_estimado: z.string().optional(),
  timeline_estimado: z.string().optional(),
  aprovado: z.boolean().default(false),
  aprovado_por: z.string().uuid().nullable().optional(),
  aprovado_em: z.string().nullable().optional(),
  created_at: z.string().optional(),
});
export type MktDiagnostico = z.infer<typeof MktDiagnosticoSchema>;

export const MktCampanhaSchema = z.object({
  nome: z.string(),
  objetivo_smart: z.string(),
  mensagens_chave: z.array(z.string()),
  budget: z.string(),
  timeline: z.string(),
  formatos: z.array(z.string()),
  audiencias_segmentadas: z.array(z.string()),
  canal: z.string(),
  prioridade: z.number().int().min(1),
});
export type MktCampanha = z.infer<typeof MktCampanhaSchema>;

export const MktKpiSchema = z.object({
  canal: z.string(),
  cac: z.string().optional(),
  ltv: z.string().optional(),
  taxa_conversao: z.string().optional(),
  roi: z.string().optional(),
});
export type MktKpi = z.infer<typeof MktKpiSchema>;

export const MktCanalSchema = z.object({
  nome: z.string(),
  justificativa: z.string(),
  percentual_alocacao: z.number().min(0).max(100),
});
export type MktCanal = z.infer<typeof MktCanalSchema>;

export const MktPosicionamentoSchema = z.object({
  brand_archetype: z.string(),
  tom_de_voz: z.string(),
  uvp: z.string(),
  posicionamento_mercado: z.string(),
});
export type MktPosicionamento = z.infer<typeof MktPosicionamentoSchema>;

export const MktEstrategiaCaptacaoSchema = z.object({
  fontes_trafego: z.array(z.string()),
  iscas_digitais: z.array(z.string()),
  metrica_principal: z.string(),
});

export const MktEstrategiaVendasQuentesSchema = z.object({
  fluxo_contato_imediato: z.string(),
  oferta_irresistivel: z.string(),
  scripts_base: z.array(z.string()),
});

export const MktEstrategiaParceriasSchema = z.object({
  perfis_parceiros: z.array(z.string()),
  modelo_comissionamento: z.string(),
  acoes_co_marketing: z.array(z.string()),
});

export const MktEstrategiaConteudoSchema = z.object({
  posicionamento: MktPosicionamentoSchema,
  mix_canais: z.array(MktCanalSchema),
  captacao: MktEstrategiaCaptacaoSchema.optional(),
  vendas_quentes: MktEstrategiaVendasQuentesSchema.optional(),
  parcerias: MktEstrategiaParceriasSchema.optional(),
  kpis: z.array(MktKpiSchema),
  campanhas: z.array(MktCampanhaSchema),
});
export type MktEstrategiaConteudo = z.infer<typeof MktEstrategiaConteudoSchema>;

export const MktEstrategiaVersaoSchema = z.object({
  id: z.string().uuid().optional(),
  estrategia_id: z.string().uuid(),
  versao: z.number().int().min(1),
  conteudo: MktEstrategiaConteudoSchema,
  gerado_por: z.string().default('estrategista_bot'),
  created_at: z.string().optional(),
});
export type MktEstrategiaVersao = z.infer<typeof MktEstrategiaVersaoSchema>;

export const MktEstrategiaSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  empresa_id: z.string().uuid(),
  nome: z.string().min(3),
  nicho: z.string().optional(),
  status: MktEstrategiaStatusSchema.default('processando'),
  doc_path: z.string().nullable().optional(),
  versao: z.number().int().min(0).default(0),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type MktEstrategia = z.infer<typeof MktEstrategiaSchema>;

export const MktCopyVariantSchema = z.object({
  id: z.string().uuid().optional(),
  estrategia_id: z.string().uuid(),
  versao: z.number().int(),
  campanha_nome: z.string(),
  tipo: z.enum(['headline', 'cta', 'body', 'landing_page', 'email']),
  canal: z.string(),
  conteudo: z.string(),
  tom: z.string().optional(),
  created_at: z.string().optional(),
});
export type MktCopyVariant = z.infer<typeof MktCopyVariantSchema>;

export const MktLeadMagnetSchema = z.object({
  id: z.string().uuid().optional(),
  estrategia_id: z.string().uuid(),
  versao: z.number().int(),
  nome: z.string(),
  persona_alvo: z.string(),
  funil_estagio: z.enum(['topo', 'meio', 'fundo']),
  landing_page: z.object({
    hero: z.string(),
    beneficios: z.array(z.string()),
    social_proof: z.string(),
    cta: z.string(),
  }),
  nurture_emails: z.array(z.object({
    assunto: z.string(),
    corpo: z.string(),
    dia_envio: z.number().int(),
  })),
  created_at: z.string().optional(),
});
export type MktLeadMagnet = z.infer<typeof MktLeadMagnetSchema>;

export const MktCalendarItemSchema = z.object({
  id: z.string().uuid().optional(),
  estrategia_id: z.string().uuid(),
  versao: z.number().int(),
  data: z.string(),
  canal: z.string(),
  tipo: z.enum(['organico', 'pago']),
  tema: z.string(),
  copy_resumo: z.string(),
  status: z.enum(['pendente', 'agendado', 'publicado']).default('pendente'),
  is_quick_win: z.boolean().default(false),
  created_at: z.string().optional(),
});
export type MktCalendarItem = z.infer<typeof MktCalendarItemSchema>;

export const MktRoadmapTaskSchema = z.object({
  id: z.string().uuid().optional(),
  estrategia_id: z.string().uuid(),
  versao: z.number().int(),
  fase: z.enum(['0-30d', '30-60d', '60-90d']),
  item: z.string(),
  responsavel: z.string().optional(),
  ferramenta: z.string().optional(),
  status: z.enum(['pendente', 'em_progresso', 'concluido']).default('pendente'),
  alerta_prazo: z.string().optional(),
  created_at: z.string().optional(),
});
export type MktRoadmapTask = z.infer<typeof MktRoadmapTaskSchema>;

export const MktAvaliacaoSchema = z.object({
  id: z.string().uuid().optional(),
  empresa_id: z.string().uuid(),
  user_id: z.string().uuid(),
  titulo_proposta: z.string().min(3),
  report_markdown: z.string().optional(),
  dados_estrategicos: z.record(z.unknown()).default({}),
  status: MktAvaliacaoStatusSchema.default('rascunho'),
  feedback_board: z.string().nullable().optional(),
  aprovado_por: z.string().uuid().nullable().optional(),
  aprovado_em: z.string().nullable().optional(),
  projeto_gerado_id: z.string().uuid().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type MktAvaliacao = z.infer<typeof MktAvaliacaoSchema>;

export const MktChatMessageSchema = z.object({
  id: z.string().uuid().optional(),
  estrategia_id: z.string().uuid(),
  role: z.enum(['user', 'assistant']),
  conteudo: z.string(),
  created_at: z.string().optional(),
});
export type MktChatMessage = z.infer<typeof MktChatMessageSchema>;

export const MktExportSchema = z.object({
  id: z.string().uuid().optional(),
  estrategia_id: z.string().uuid(),
  versao: z.number().int(),
  formato: z.enum(['pdf', 'pptx']),
  status: MktJobStatusSchema.default('pending'),
  file_path: z.string().nullable().optional(),
  signed_url: z.string().nullable().optional(),
  signed_url_expires_at: z.string().nullable().optional(),
  file_size_bytes: z.number().int().nullable().optional(),
  created_at: z.string().optional(),
  completed_at: z.string().nullable().optional(),
});
export type MktExport = z.infer<typeof MktExportSchema>;

export const MktAgentSlotSchema = z.enum([
  'extrator',
  'estrategista',
  'redator',
  'calendario',
  'exportador',
  'onboarding',
]);
export type MktAgentSlot = z.infer<typeof MktAgentSlotSchema>;

export const MktAgentSchema = z.object({
  id: z.string().uuid().optional(),
  empresa_id: z.string().uuid(),
  slot: MktAgentSlotSchema,
  nome: z.string(),
  descricao: z.string(),
  ativo: z.boolean().default(true),
  arva_agent_id: z.string().nullable().optional(),
  config: z.record(z.unknown()).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type MktAgent = z.infer<typeof MktAgentSchema>;

export const MktAgentActionLogSchema = z.object({
  id: z.string().uuid().optional(),
  empresa_id: z.string().uuid(),
  agent_id: z.string().uuid().optional(),
  slot: MktAgentSlotSchema,
  acao: z.string(),
  entidade_tipo: z.string(),
  entidade_id: z.string().uuid(),
  detalhes: z.record(z.unknown()).optional(),
  executado_por: z.string().uuid(),
  created_at: z.string().optional(),
});
export type MktAgentActionLog = z.infer<typeof MktAgentActionLogSchema>;

export const MktProcessingJobSchema = z.object({
  id: z.string().uuid().optional(),
  empresa_id: z.string().uuid(),
  estrategia_id: z.string().uuid(),
  categoria: MktJobCategorySchema,
  status: MktJobStatusSchema.default('pending'),
  tentativas: z.number().int().min(0).default(0),
  max_tentativas: z.number().int().min(1).default(3),
  erro_mensagem: z.string().nullable().optional(),
  payload: z.record(z.unknown()).optional(),
  started_at: z.string().nullable().optional(),
  completed_at: z.string().nullable().optional(),
  failed_at: z.string().nullable().optional(),
  next_attempt_at: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type MktProcessingJob = z.infer<typeof MktProcessingJobSchema>;

export const MktBrandingSchema = z.object({
  id: z.string().uuid().optional(),
  empresa_id: z.string().uuid(),
  logo_path: z.string().nullable().optional(),
  cor_primaria: z.string().default('#0EA5E9'),
  cor_secundaria: z.string().default('#8B5CF6'),
  fonte_principal: z.string().default('Inter'),
  nome_empresa: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type MktBranding = z.infer<typeof MktBrandingSchema>;

export const MktSseEventSchema = z.object({
  stage: MktSseStageSchema,
  progress: z.number().int().min(0).max(100),
  message: z.string(),
  agent: z.string().optional(),
  timestamp: z.string(),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }).nullable().optional(),
});
export type MktSseEvent = z.infer<typeof MktSseEventSchema>;

export const MktDashboardKpisSchema = z.object(
  {
    estrategias_ativas: z.number().int(),
    estrategias_processando: z.number().int(),
    total_diagnosticos: z.number().int(),
    total_exportacoes: z.number().int(),
    taxa_aprovacao: z.number(),
    tempo_medio_geracao: z.number(),
    agentes_ativos: z.number().int(),
    jobs_falha: z.number().int(),
  },
);
export type MktDashboardKpis = z.infer<typeof MktDashboardKpisSchema>;

export const MktEstrategiasQuerySchema = z.object({
  status: z.array(MktEstrategiaStatusSchema).optional(),
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().positive().max(100).default(10),
  sort_by: z.enum(['nome', 'status', 'created_at', 'versao']).default('created_at'),
  sort_dir: z.enum(['asc', 'desc']).default('desc'),
});
export type MktEstrategiasQuery = z.infer<typeof MktEstrategiasQuerySchema>;

// Legacy aliases for backward compatibility with leads module
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
