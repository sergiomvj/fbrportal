import { z } from 'zod';

export const LeadEtapaSchema = z.enum([
  'captado',
  'email_validado',
  'icp_matching',
  'scoring',
  'redacao',
  'cadencia',
  'sql_entregue',
  'descartado',
]);
export type LeadEtapa = z.infer<typeof LeadEtapaSchema>;

export const LeadFonteSchema = z.enum(['linkedin', 'cnpj_biz', 'google_maps', 'site', 'manual']);
export type LeadFonte = z.infer<typeof LeadFonteSchema>;

export const EmailValidoSchema = z.enum(['safe', 'catch_all', 'invalido', 'disposable', 'nao_verificado']);
export type EmailValido = z.infer<typeof EmailValidoSchema>;

export const LeadSchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  empresa_nome: z.string().min(1),
  empresa_cnpj: z.string().optional(),
  contato_nome: z.string().min(1),
  contato_email: z.string().email().optional(),
  contato_cargo: z.string().optional(),
  contato_linkedin: z.string().url().optional(),
  contato_telefone: z.string().optional(),
  setor: z.string().optional(),
  porte: z.string().optional(),
  regiao: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  funcionarios: z.number().int().optional(),
  faturamento: z.number().optional(),
  fonte: LeadFonteSchema.default('manual'),
  fonte_url: z.string().optional(),
  etapa: LeadEtapaSchema.default('captado'),
  score: z.number().int().min(0).max(100).default(0),
  icp_id: z.string().uuid().optional(),
  email_valido: EmailValidoSchema.default('nao_verificado'),
  motivo_descarte: z.string().optional(),
  presenca_digital: z.enum(['forte', 'media', 'fraca', 'nenhuma']).optional(),
  site_url: z.string().url().optional(),
  site_tecnologias: z.array(z.string()).default([]),
  site_pagespeed: z.number().int().min(0).max(100).optional(),
  site_https: z.boolean().optional(),
  site_blog_ativo: z.boolean().optional(),
  headline: z.string().optional(),
  ultima_atividade: z.string().optional(),
  conexoes_comum: z.number().int().optional(),
  notas: z.string().optional(),
  hash_deduplicacao: z.string().optional(),
  fontes_origem: z.array(LeadFonteSchema).default([]),
  score_detalhado: z.object({
    aderencia_setor: z.number().default(0),
    porte_empresa: z.number().default(0),
    cargo_contato: z.number().default(0),
    regiao: z.number().default(0),
    tamanho_empresa: z.number().default(0),
    qualidade_email: z.number().default(0),
    presenca_digital: z.number().default(0),
    atividade_recente: z.number().default(0),
    engajamento_cadencia: z.number().default(0),
    enriquecimento_completo: z.number().default(0),
    fit_icp_keywords: z.number().default(0),
    score_site: z.number().default(0),
    bonus_total: z.number().default(0),
    penalidade_total: z.number().default(0),
  }).optional(),
  created_by: z.string().uuid().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type Lead = z.infer<typeof LeadSchema>;

export const LeadsQuerySchema = z.object({
  busca: z.string().optional(),
  etapa: z.array(LeadEtapaSchema).optional(),
  fonte: z.array(LeadFonteSchema).optional(),
  icp_id: z.string().uuid().optional(),
  score_min: z.coerce.number().int().min(0).max(100).optional(),
  score_max: z.coerce.number().int().min(0).max(100).optional(),
  email_valido: z.array(EmailValidoSchema).optional(),
  data_inicio: z.string().optional(),
  data_fim: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().positive().max(100).default(20),
  sort_by: z.enum(['contato_nome', 'empresa_nome', 'score', 'etapa', 'created_at']).default('created_at'),
  sort_dir: z.enum(['asc', 'desc']).default('desc'),
});
export type LeadsQuery = z.infer<typeof LeadsQuerySchema>;

export const ICPSchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  nome: z.string().min(1),
  descricao: z.string().optional(),
  setor: z.array(z.string()).default([]),
  porte: z.array(z.string()).default([]),
  cargo_alvo: z.array(z.string()).default([]),
  regiao: z.array(z.string()).default([]),
  score_minimo: z.number().int().min(1).max(100).default(60),
  keywords: z.array(z.string()).default([]),
  exclusoes: z.array(z.string()).default([]),
  porte_funcionarios_min: z.number().int().optional(),
  porte_funcionarios_max: z.number().int().optional(),
  faturamento_minimo: z.number().optional(),
  dominio_email_permitido: z.array(z.enum(['corporativo', 'todos'])).default(['todos']),
  ativo: z.boolean().default(true),
  total_leads: z.number().int().default(0),
  total_sqls: z.number().int().default(0),
  taxa_conversao: z.number().default(0),
  created_at: z.string().optional(),
});
export type ICP = z.infer<typeof ICPSchema>;

export const DomainStatusSchema = z.enum(['saudavel', 'atencao', 'critico', 'bloqueado', 'aquecendo']);
export type DomainStatus = z.infer<typeof DomainStatusSchema>;

export const DomainWarmingPhaseSchema = z.enum(['fase1', 'fase2', 'fase3', 'fase4']);
export type DomainWarmingPhase = z.infer<typeof DomainWarmingPhaseSchema>;

export const DomainSchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  dominio: z.string().min(1),
  status: DomainStatusSchema.default('aquecendo'),
  warming_phase: DomainWarmingPhaseSchema.default('fase1'),
  warming_dia: z.number().int().min(0).default(0),
  bounce_rate: z.number().min(0).max(100).default(0),
  envios_hoje: z.number().int().min(0).default(0),
  limite_diario: z.number().int().min(0).default(5),
  open_rate: z.number().min(0).max(100).default(0),
  spam_complaint_rate: z.number().min(0).max(100).default(0),
  blacklist: z.boolean().default(false),
  spf_ok: z.boolean().default(false),
  dkim_ok: z.boolean().default(false),
  dmarc_ok: z.boolean().default(false),
  total_envios_7d: z.number().int().default(0),
  total_bounces_7d: z.number().int().default(0),
  created_at: z.string().optional(),
});
export type Domain = z.infer<typeof DomainSchema>;

export const CadenciaStatusSchema = z.enum(['enviado', 'bounce', 'aberto', 'clicou', 'respondido']);
export type CadenciaStatus = z.infer<typeof CadenciaStatusSchema>;

export const EmailCadenciaSchema = z.object({
  id: z.string().uuid().optional(),
  lead_id: z.string().uuid(),
  company_id: z.string().uuid(),
  toque: z.number().int().min(1).max(4),
  dominio_id: z.string().uuid().optional(),
  status: CadenciaStatusSchema.default('enviado'),
  subject: z.string().optional(),
  body: z.string().optional(),
  agente: z.string().optional(),
  enviado_em: z.string().optional(),
  aberto_em: z.string().optional(),
  respondido_em: z.string().optional(),
  resposta_tipo: z.enum(['positiva', 'neutra', 'negativa', 'stop']).optional(),
  resposta_conteudo: z.string().optional(),
  created_at: z.string().optional(),
});
export type EmailCadencia = z.infer<typeof EmailCadenciaSchema>;

export const EmailTemplateSchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  icp_id: z.string().uuid().optional(),
  nome: z.string().min(1),
  toque: z.number().int().min(1).max(4),
  subject_template: z.string().min(1),
  body_template: z.string().min(1),
  variaveis: z.array(z.string()).default([]),
  ativo: z.boolean().default(true),
  created_at: z.string().optional(),
});
export type EmailTemplate = z.infer<typeof EmailTemplateSchema>;

export const AgentStatusSchema = z.enum(['online', 'offline', 'processando', 'erro']);
export type AgentStatus = z.infer<typeof AgentStatusSchema>;

export const AgentSchema = z.object({
  id: z.string().uuid().optional(),
  nome: z.string().min(1),
  time_numero: z.number().int().min(1).max(6),
  time_nome: z.string().min(1),
  role: z.string().min(1),
  status: AgentStatusSchema.default('online'),
  tasks_ativas: z.number().int().default(0),
  processadas_24h: z.number().int().default(0),
  fila: z.number().int().default(0),
  llm_primario: z.string().optional(),
  paused: z.boolean().default(false),
});
export type Agent = z.infer<typeof AgentSchema>;

export const AgentLogSchema = z.object({
  id: z.string().uuid().optional(),
  agent_nome: z.string().min(1),
  tipo: z.enum(['agent_start', 'agent_progress', 'agent_complete', 'agent_failure', 'alerta_novo']),
  mensagem: z.string().min(1),
  lead_id: z.string().uuid().optional(),
  timestamp: z.string().optional(),
});
export type AgentLog = z.infer<typeof AgentLogSchema>;

export const CampaignStatusSchema = z.enum(['rascunho', 'ativa', 'pausada', 'concluida']);
export type CampaignStatus = z.infer<typeof CampaignStatusSchema>;

export const CampaignSchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  nome: z.string().min(1),
  descricao: z.string().optional(),
  icp_id: z.string().uuid().optional(),
  status: CampaignStatusSchema.default('rascunho'),
  total_leads: z.number().int().default(0),
  leads_qualificados: z.number().int().default(0),
  taxa_abertura: z.number().default(0),
  taxa_clique: z.number().default(0),
  taxa_resposta: z.number().default(0),
  bounce_rate: z.number().default(0),
  dominio_id: z.string().uuid().optional(),
  cadencia_config: z.array(z.object({
    toque: z.number().int(),
    dia: z.number().int(),
    horario_inicio: z.string(),
    horario_fim: z.string(),
    template_id: z.string().uuid().optional(),
  })).default([]),
  created_at: z.string().optional(),
});
export type Campaign = z.infer<typeof CampaignSchema>;

export const HandoffPayloadSchema = z.object({
  event: z.literal('sql_handoff'),
  lead: z.object({
    lead_id: z.string().uuid(),
    name: z.string(),
    role: z.string().optional(),
    company: z.string(),
    cnpj: z.string().optional(),
    email: z.string().email(),
    score: z.number().int(),
    source: LeadFonteSchema,
    icp_match: z.string().optional(),
    enrichment_notes: z.string().optional(),
    interaction_summary: z.string().optional(),
  }),
  action: z.object({
    create_deal: z.boolean(),
    notify_user_id: z.string().optional(),
    post_to_channel: z.string().optional(),
  }),
});
export type HandoffPayload = z.infer<typeof HandoffPayloadSchema>;

export const ReportSchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  periodo: z.string().min(1),
  tipo: z.enum(['semanal', 'mensal', 'custom']),
  leads_captados: z.number().int().default(0),
  leads_qualificados: z.number().int().default(0),
  sqls_entregues: z.number().int().default(0),
  taxa_resposta: z.number().default(0),
  bounce_rate: z.number().default(0),
  score_medio: z.number().default(0),
  icp_perfomance: z.array(z.object({
    icp_id: z.string().uuid(),
    icp_nome: z.string(),
    leads: z.number().int(),
    sqls: z.number().int(),
    taxa_conversao: z.number(),
  })).default([]),
  sugestoes: z.array(z.string()).default([]),
  gerado_por: z.string().default('time6_inteligencia'),
  created_at: z.string().optional(),
});
export type Report = z.infer<typeof ReportSchema>;

export const DashboardKpisSchema = z.object({
  leads_captados_hoje: z.number().int(),
  leads_semana: z.number().int(),
  taxa_validacao: z.number(),
  emails_enviados_hoje: z.number().int(),
  bounce_rate: z.number(),
  sqls_entregues: z.number().int(),
  score_medio: z.number(),
  total_leads: z.number().int(),
  leads_por_etapa: z.array(z.object({ etapa: z.string(), count: z.number().int() })),
  leads_por_fonte: z.array(z.object({ fonte: z.string(), count: z.number().int() })),
  leads_por_icp: z.array(z.object({ icp: z.string(), count: z.number().int() })),
  saude_dominios: z.array(z.object({
    dominio: z.string(),
    status: z.string(),
    bounce_rate: z.number(),
    envios_hoje: z.number().int(),
    limite_diario: z.number().int(),
    percentual_utilizado: z.number(),
  })),
  ultimos_sqls: z.array(z.object({
    lead_id: z.string(),
    contato_nome: z.string(),
    empresa_nome: z.string(),
    score: z.number().int(),
    icp_nome: z.string().optional(),
    entregue_em: z.string(),
  })),
});
export type DashboardKpis = z.infer<typeof DashboardKpisSchema>;
