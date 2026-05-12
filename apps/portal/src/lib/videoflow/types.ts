import { z } from 'zod';

export const ProductionStatusSchema = z.enum([
  'briefing',
  'orquestrador',
  'producao',
  'revisao',
  'pacote_pronto',
  'concluido',
  'falhou',
]);
export type ProductionStatus = z.infer<typeof ProductionStatusSchema>;

export const ChannelSchema = z.enum([
  'instagram_reels',
  'youtube',
  'tiktok',
  'linkedin',
  'twitter',
  'facebook_feed',
  'stories',
  'tv_web',
]);
export type Channel = z.infer<typeof ChannelSchema>;

export const AspectRatioSchema = z.enum([
  '9:16',
  '16:9',
  '1:1',
  '4:5',
  '21:9',
]);
export type AspectRatio = z.infer<typeof AspectRatioSchema>;

export const TomEmocionalSchema = z.enum([
  'esperançoso',
  'urgente',
  'inspirador',
  'sóbrio',
  'empolgado',
  'empático',
  'neutro',
]);

export const ArcoDramaticoSchema = z.enum([
  'problema-solução',
  'antes-depois',
  'jornada-heroica',
  'tensão-revelação',
  'lista-educativa',
  'storytelling-pessoal',
]);

export const POVSchema = z.enum([
  'primeira-pessoa',
  'terceira-pessoa',
  'observador',
  'teste-social',
  'documental',
]);

export const AberturaEmocionalSchema = z.enum([
  'gancho_forte',
  'pergunta_retorica',
  'dado_surpresa',
  'cena_impacto',
  'silencio_contrastado',
]);

export const EstiloVisualSchema = z.enum([
  'minimalista',
  'brutalista',
  'corporativo',
  'editorial',
  'pop',
  'cinematográfico',
  'flat_design',
  '3d_render',
]);

export const MovimentoCameraSchema = z.enum([
  'estatico',
  'panoramico',
  'zoom_lento',
  'tracking',
  'handheld',
  'crane',
  'dolly',
]);

export const TransicaoSchema = z.enum([
  'corte_seco',
  'dissolve',
  'zoom_transicao',
  'slide',
  'fade',
  'morph',
  'glitch',
]);

export const GeneroMusicalSchema = z.enum([
  'lofi',
  'cinematico',
  'corporativo',
  'eletronico',
  'acustico',
  'rock',
  'hip_hop',
  'sem_musica',
]);

export const PresencaVozSchema = z.enum([
  'voiceover_humano',
  'voiceover_ai',
  'sem_voz',
  'dialogo',
  'narração_texto',
]);

export const SincroniaAudioVideoSchema = z.enum([
  'beat_sync',
  'narração_driven',
  'tempo_livre',
  'silencio_estruturado',
]);

export const DAVectorNarrativaSchema = z.object({
  tom_emocional: TomEmocionalSchema,
  arco_dramatico: ArcoDramaticoSchema,
  pov: POVSchema,
  densidade_informacao: z.number().min(0.1).max(1.0),
  tensao_resolucao: z.object({
    tensao: z.number().min(0).max(1),
    resolucao: z.number().min(0).max(1),
  }),
  abertura_emocional: AberturaEmocionalSchema,
  cta: z.string().max(150),
});

export const DAVectorVisualSchema = z.object({
  paleta_cores: z.object({
    primaria: z.string(),
    secundaria: z.string(),
    accento: z.string(),
    fundo: z.string(),
  }),
  temperatura_cor: z.number().min(-1).max(1),
  estilo_visual: EstiloVisualSchema,
  hierarquia_visual: z.object({
    foco: z.enum(['centro', 'esquerda', 'direita', 'superior', 'inferior']),
    simetria: z.boolean(),
    grid: z.enum(['terços', 'centro', 'diagonal']),
  }),
  tipografia: z.object({
    fonte_titulo: z.string(),
    fonte_corpo: z.string(),
    tamanho_min: z.string(),
    cor: z.string(),
  }),
  densidade_quadros: z.number().min(0.1).max(1.0),
  movimento_camera: MovimentoCameraSchema,
  transicoes: TransicaoSchema,
});

export const DAVectorSonoroSchema = z.object({
  genero_musical: GeneroMusicalSchema,
  energia_trilha: z.number().min(0.1).max(1.0),
  presenca_voz: PresencaVozSchema,
  uso_silencio: z.number().min(0).max(1.0),
  design_som: z.object({
    efeitos: z.array(z.string()),
    ambiente: z.string(),
    sample_rate: z.string(),
  }),
  sincronia_audio_video: SincroniaAudioVideoSchema,
});

export const DAVectorFormatoSchema = z.object({
  duracao_total_seg: z.number().int().min(5).max(3600),
  proporcao: AspectRatioSchema,
  ritmo_corte: z.number().min(0.1).max(1.0),
  plataforma: ChannelSchema,
  legendas: z.object({
    habilitado: z.boolean(),
    estilo: z.enum(['burned', 'closed', 'cc']),
    idioma: z.string(),
    fonte: z.string(),
    posicao: z.enum(['inferior', 'superior', 'centro']),
  }),
});

export const DAVectorMarcaSchema = z.object({
  personalidade_marca: z.string().max(200),
  restricoes_visuais: z.array(z.string()),
  tom_voz_marca: z.string().max(200),
  elementos_obrigatorios: z.array(z.string()),
  brand_kit_id: z.string().uuid().optional(),
});

export const DAVectorMetaSchema = z.object({
  originalidade: z.number().min(0).max(1),
  referencia_cultural: z.array(z.string()),
  grau_convecionalismo: z.number().min(0).max(1),
  consistencia_serie: z.string().uuid().nullable(),
});

export const DAVectorSchema = z.object({
  narrativa: DAVectorNarrativaSchema,
  visual: DAVectorVisualSchema,
  sonoro: DAVectorSonoroSchema,
  formato: DAVectorFormatoSchema,
  marca: DAVectorMarcaSchema,
  meta: DAVectorMetaSchema,
});
export type DAVector = z.infer<typeof DAVectorSchema>;

export const BriefingSchema = z.object({
  empresa_id: z.string().uuid(),
  user_id: z.string().uuid(),
  objetivo: z.string(),
  canal: ChannelSchema,
  duracao_seg: z.number().int().min(5).max(3600),
  público_alvo: z.string(),
  tom: z.string(),
  referencias: z.array(z.string()),
  brand_kit_id: z.string().uuid().nullable(),
});

export const HandoffSchemaSchema = z.object({
  production_id: z.string().uuid(),
  versao_schema: z.string(),
  algoritmo_assinatura: z.literal('sha256').default('sha256'),
  briefing: BriefingSchema,
  vetor_da: DAVectorSchema.nullable(),
  esqueleto: z.object({
    fonte_conceito_id: z.string().uuid().nullable(),
    similaridade: z.number().nullable(),
    arco_narrativo_sugerido: z.string().nullable(),
  }).nullable(),
  memoria_de_marca: z.object({
    brand_kit: z.record(z.unknown()).nullable(),
    guia_tom: z.record(z.unknown()).nullable(),
    restricoes: z.array(z.string()),
    aprovados_recentes: z.array(z.string()),
  }).nullable(),
  pipeline: z.object({
    etapa_atual: z.string(),
    etapas_concluidas: z.array(z.string()),
    historico: z.array(z.object({
      etapa: z.string(),
      agente: z.string(),
      timestamp: z.string(),
      hash_output: z.string(),
      hash_envelope: z.string(),
    })),
    outputs: z.record(z.unknown()).default({}),
  }),
  publication_handoff: z.object({
    destination_module: z.literal('fbr-social'),
    status: z.enum(['pendente', 'processando', 'entregue']),
    package_zip_path: z.string().nullable(),
    package_manifest: z.record(z.unknown()).nullable(),
    social_job_id: z.string().nullable(),
    poll_url: z.string().nullable(),
  }).nullable(),
  hash_envelope: z.string(),
});
export type HandoffSchema = z.infer<typeof HandoffSchemaSchema>;

export const ProductionSchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  nome: z.string().min(1),
  briefing: BriefingSchema,
  vetor_da: DAVectorSchema.nullable(),
  handoff: HandoffSchemaSchema.nullable(),
  status: ProductionStatusSchema.default('briefing'),
  custo_estimado: z.number().default(0),
  custo_real: z.number().default(0),
  etapa_pipeline: z.string().optional(),
  owner_id: z.string().uuid().optional(),
  created_by: z.string().uuid().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type Production = z.infer<typeof ProductionSchema>;

export const ConceptSchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  titulo: z.string().min(1),
  video_url: z.string().url().optional(),
  thumbnail_url: z.string().url().optional(),
  canal: ChannelSchema.optional(),
  tom: z.string().optional(),
  tags: z.array(z.string()).default([]),
  vetor_da_extraido: DAVectorSchema.optional(),
  analise_narrativa: z.record(z.unknown()).optional(),
  analise_sonora: z.record(z.unknown()).optional(),
  score_qualidade: z.number().min(0).max(1).optional(),
  aprovado: z.boolean().default(false),
  usos: z.number().int().default(0),
  embedding: z.array(z.number()).optional(),
  created_at: z.string().optional(),
});
export type Concept = z.infer<typeof ConceptSchema>;

export const AgentSchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  nome: z.string().min(1),
  funcao: z.enum([
    'orquestrador',
    'referencias',
    'elementos',
    'editor',
    'publicacao',
    'supervisor',
  ]),
  descricao: z.string().optional(),
  model: z.string().optional(),
  prompt: z.string().optional(),
  ativo: z.boolean().default(true),
  created_at: z.string().optional(),
});
export type Agent = z.infer<typeof AgentSchema>;

export const TemplatePresetSchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  nome: z.string().min(1),
  tipo: z.enum(['shorts', 'video_comum', 'mini_doc']),
  descricao: z.string().optional(),
  duracao_padrao: z.number().int().min(5).max(3600),
  proporcao_padrao: AspectRatioSchema,
  plataforma_padrao: ChannelSchema,
  vetor_da: DAVectorSchema.optional(),
  ativo: z.boolean().default(true),
  created_at: z.string().optional(),
});
export type TemplatePreset = z.infer<typeof TemplatePresetSchema>;

export const QualityRubricSchema = z.object({
  id: z.string().uuid().optional(),
  production_id: z.string().uuid(),
  narrativa_score: z.number().int().min(1).max(5),
  visual_score: z.number().int().min(1).max(5),
  sonoro_score: z.number().int().min(1).max(5),
  formato_score: z.number().int().min(1).max(5),
  marca_score: z.number().int().min(1).max(5),
  nota_final: z.number().min(1).max(5),
  observacoes: z.string().optional(),
  revisado_por: z.string().uuid().optional(),
  revisado_em: z.string().optional(),
  created_at: z.string().optional(),
});
export type QualityRubric = z.infer<typeof QualityRubricSchema>;

export const ProductionQuerySchema = z.object({
  busca: z.string().optional(),
  status: z.array(ProductionStatusSchema).optional(),
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().positive().max(100).default(20),
  sort_by: z.enum(['nome', 'status', 'custo_estimado', 'created_at']).default('created_at'),
  sort_dir: z.enum(['asc', 'desc']).default('desc'),
});
export type ProductionQuery = z.infer<typeof ProductionQuerySchema>;

export const ConceptQuerySchema = z.object({
  busca: z.string().optional(),
  canal: ChannelSchema.optional(),
  tags: z.array(z.string()).optional(),
  aprovado: z.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().positive().max(100).default(20),
});
export type ConceptQuery = z.infer<typeof ConceptQuerySchema>;

export const VideoFlowDashboardKpisSchema = z.object({
  producoes_ativas: z.number(),
  producoes_concluidas: z.number(),
  custo_total_mes: z.number(),
  custo_medio_minuto: z.number(),
  conceitos_aprovados: z.number(),
  agentes_ativos: z.number(),
  producoes_por_status: z.record(z.number()),
  custo_por_semana: z.array(z.object({ semana: z.string(), custo: z.number() })),
});
export type VideoFlowDashboardKpis = z.infer<typeof VideoFlowDashboardKpisSchema>;

export const CreateProductionBodySchema = z.object({
  nome: z.string().min(1),
  briefing: BriefingSchema,
});
export type CreateProductionBody = z.infer<typeof CreateProductionBodySchema>;

export const UpdateVetorDABodySchema = z.object({
  vetor_da: DAVectorSchema,
});
export type UpdateVetorDABody = z.infer<typeof UpdateVetorDABodySchema>;

export const ConceptSearchBodySchema = z.object({
  query: z.string().min(1),
  top_k: z.number().int().positive().default(3),
});
export type ConceptSearchBody = z.infer<typeof ConceptSearchBodySchema>;

export const CreateConceptBodySchema = z.object({
  titulo: z.string().min(1),
  video_url: z.string().url().optional(),
  thumbnail_url: z.string().url().optional(),
  canal: ChannelSchema.optional(),
  tom: z.string().optional(),
  tags: z.array(z.string()).optional(),
});
export type CreateConceptBody = z.infer<typeof CreateConceptBodySchema>;
