import { z } from 'zod';

export const EtapaArtigoSchema = z.enum([
  'coletado',
  'redigido',
  'com_midia',
  'editado',
  'publicado',
  'erro',
  'reprovado',
]);
export type EtapaArtigo = z.infer<typeof EtapaArtigoSchema>;

export const TipoArtigoSchema = z.enum(['noticia', 'analise', 'traducao']);
export type TipoArtigo = z.infer<typeof TipoArtigoSchema>;

export const ArtigoSchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  titulo: z.string().min(1),
  conteudo_pt: z.string(),
  conteudo_en: z.string().optional(),
  cidade: z.string().min(1),
  tipo: TipoArtigoSchema,
  fonte_url: z.string().url().optional(),
  fonte_nome: z.string().optional(),
  etapa: EtapaArtigoSchema.default('coletado'),
  agente_atual: z.string().optional(),
  url_publicado: z.string().url().optional(),
  imagem_url: z.string().url().optional(),
  retry_count: z.number().int().default(0),
  created_by: z.string().uuid().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  publicado_em: z.string().optional(),
});
export type Artigo = z.infer<typeof ArtigoSchema>;

export const ArtigosQuerySchema = z.object({
  busca: z.string().optional(),
  etapa: z.array(EtapaArtigoSchema).optional(),
  cidade: z.string().optional(),
  tipo: z.array(TipoArtigoSchema).optional(),
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().positive().max(100).default(20),
  sort_by: z.enum(['titulo', 'etapa', 'cidade', 'tipo', 'created_at']).default('created_at'),
  sort_dir: z.enum(['asc', 'desc']).default('desc'),
});
export type ArtigosQuery = z.infer<typeof ArtigosQuerySchema>;

export const FonteRSSSchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  cidade: z.string().min(1),
  url: z.string().url(),
  nome: z.string().min(1),
  ativo: z.boolean().default(true),
  ultimo_ok: z.string().optional(),
  intervalo_minutos: z.number().int().default(15),
  created_at: z.string().optional(),
});
export type FonteRSS = z.infer<typeof FonteRSSSchema>;

export const UGCStatusSchema = z.enum(['pendente', 'aceito', 'rejeitado']);
export type UGCStatus = z.infer<typeof UGCStatusSchema>;

export const UGCSubmissionSchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  submissor: z.string().optional(),
  email: z.string().email().optional(),
  cidade: z.string().optional(),
  descricao: z.string().min(20),
  status: UGCStatusSchema.default('pendente'),
  artigo_id: z.string().uuid().optional(),
  auto_aprovavel: z.boolean().default(false),
  score_confianca: z.number().int().min(0).max(100).default(0),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type UGCSubmission = z.infer<typeof UGCSubmissionSchema>;

export const AlertaNivelSchema = z.enum(['info', 'warn', 'error']);
export type AlertaNivel = z.infer<typeof AlertaNivelSchema>;

export const AlertaTipoSchema = z.enum([
  'falha_agente',
  'fonte_indisponivel',
  'conteudo_sensivel',
  'queda_performance',
  'qualidade_baixa',
  'imagem_nao_encontrada',
  'limite_api_atingido',
  'ugc_spam_detectado',
]);
export type AlertaTipo = z.infer<typeof AlertaTipoSchema>;

export const AlertaSchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  tipo: AlertaTipoSchema,
  mensagem: z.string().min(1),
  nivel: AlertaNivelSchema.default('info'),
  resolvido: z.boolean().default(false),
  artigo_id: z.string().uuid().optional(),
  agente: z.string().optional(),
  contexto: z.record(z.unknown()).optional(),
  resolvido_por: z.string().optional(),
  resolvido_em: z.string().optional(),
  created_at: z.string().optional(),
});
export type Alerta = z.infer<typeof AlertaSchema>;

export const RedacaoAgentSchema = z.object({
  id: z.string().optional(),
  nome: z.string().min(1),
  fila_celery: z.string().min(1),
  status: z.enum(['online', 'offline', 'processando', 'erro']),
  tasks_ativas: z.number().int().default(0),
  processadas_24h: z.number().int().default(0),
  fila: z.number().int().default(0),
  llm_primario: z.string().optional(),
  descricao: z.string().optional(),
});
export type RedacaoAgent = z.infer<typeof RedacaoAgentSchema>;

export const DashboardKpisSchema = z.object({
  total_artigos: z.number().int(),
  publicados_hoje: z.number().int(),
  em_producao: z.number().int(),
  ugc_pendentes: z.number().int(),
  alertas_ativos: z.number().int(),
  fontes_ativas: z.number().int(),
  artigos_por_etapa: z.array(z.object({ etapa: z.string(), count: z.number().int() })),
  artigos_por_cidade: z.array(z.object({ cidade: z.string(), count: z.number().int() })),
  artigos_por_tipo: z.array(z.object({ tipo: z.string(), count: z.number().int() })),
  agentes: z.array(RedacaoAgentSchema),
  alertas_por_nivel: z.array(z.object({ nivel: z.string(), count: z.number().int() })),
});
export type DashboardKpis = z.infer<typeof DashboardKpisSchema>;
