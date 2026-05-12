import { z } from 'zod';

export const HexColorSchema = z.string().regex(/^#[0-9A-F]{6}$/i, 'Use #RRGGBB.');
export const FontWeightSchema = z.enum(['100', '200', '300', '400', '500', '600', '700', '800', '900']);

export const DesignFormatCategorySchema = z.enum([
  'social_media',
  'digital_ads',
  'identidade_visual',
  'documentos',
]);
export type DesignFormatCategory = z.infer<typeof DesignFormatCategorySchema>;

export const DesignFormatSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  category: DesignFormatCategorySchema,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  aspect_ratio: z.string().min(1),
  safe_zone_width: z.number().int().positive().optional(),
  safe_zone_height: z.number().int().positive().optional(),
  usage: z.string().min(1),
});
export type DesignFormat = z.infer<typeof DesignFormatSchema>;

export const BrandKitFontSchema = z.object({
  family: z.string().min(1),
  weight: FontWeightSchema,
  url: z.string().url().optional(),
});
export type BrandKitFont = z.infer<typeof BrandKitFontSchema>;

export const BrandKitColorsSchema = z.object({
  primary: HexColorSchema,
  secondary: HexColorSchema.optional(),
  accent: HexColorSchema.optional(),
  background_light: HexColorSchema.optional(),
  background_dark: HexColorSchema.optional(),
  text_light: HexColorSchema.optional(),
  text_dark: HexColorSchema.optional(),
  success: HexColorSchema.optional(),
  warning: HexColorSchema.optional(),
  error: HexColorSchema.optional(),
});
export type BrandKitColors = z.infer<typeof BrandKitColorsSchema>;

export const BrandKitGuidelinesSchema = z.object({
  logo_min_size_px: z.number().int().min(40).default(80),
  logo_clear_space_px: z.number().int().min(10).default(20),
  do_not_distort_logo: z.boolean().default(true),
  preferred_photo_style: z.enum(['fotografico', 'ilustrado', 'flat', '3d', 'abstract']).default('fotografico'),
  tone_of_voice: z.enum(['formal', 'informal', 'tecnico', 'emocional', 'humoristico', 'premium']).default('premium'),
  banned_words: z.array(z.string()).default([]),
  max_text_area_percent: z.number().min(10).max(80).default(40),
});
export type BrandKitGuidelines = z.infer<typeof BrandKitGuidelinesSchema>;

export const BrandKitLogoVariantsSchema = z.object({
  claro: z.string().min(1).optional(),
  escuro: z.string().min(1).optional(),
  mono_preto: z.string().min(1).optional(),
  mono_branco: z.string().min(1).optional(),
  favicon: z.string().min(1).optional(),
});
export type BrandKitLogoVariants = z.infer<typeof BrandKitLogoVariantsSchema>;

export const BrandKitSchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  client_id: z.string().uuid(),
  nome: z.string().min(1),
  empresa: z.string().min(1),
  segmento: z.string().min(1),
  versao: z.number().int().positive().default(1),
  ativo: z.boolean().default(true),
  cores: BrandKitColorsSchema,
  fontes: z.object({
    heading: BrandKitFontSchema,
    body: BrandKitFontSchema,
    accent: BrandKitFontSchema.optional(),
  }),
  guidelines: BrandKitGuidelinesSchema,
  logo_variants: BrandKitLogoVariantsSchema.default({}),
  updated_at: z.string().optional(),
  created_at: z.string().optional(),
});
export type BrandKit = z.infer<typeof BrandKitSchema>;

export const DesignJobStatusSchema = z.enum([
  'briefing',
  'asset_finder',
  'composicao',
  'auto_review',
  'render',
  'ready',
  'approved',
  'published',
]);
export type DesignJobStatus = z.infer<typeof DesignJobStatusSchema>;

export const DesignVariantStatusSchema = z.enum(['queued', 'processing', 'review_blocked', 'ready', 'approved', 'published']);
export type DesignVariantStatus = z.infer<typeof DesignVariantStatusSchema>;

export const DesignVariantSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().min(1),
  format_slug: z.string().min(1),
  status: DesignVariantStatusSchema.default('queued'),
  progress: z.number().min(0).max(100).default(0),
  headline: z.string().min(1),
  body: z.string().min(1),
  cta: z.string().min(1).optional(),
  background_tone: z.enum(['light', 'dark']).default('dark'),
  dominant_colors: z.array(HexColorSchema).min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  safe_zone_ok: z.boolean().default(true),
  logo_size_px: z.number().int().positive(),
  logo_contrast_ratio: z.number().positive(),
  min_text_size_pt: z.number().positive(),
  text_area_percent: z.number().min(0).max(100),
  rendered_url: z.string().url().optional(),
  output_formats: z.array(z.enum(['png', 'jpg', 'pdf', 'pptx', 'zip'])).default(['png', 'jpg']),
});
export type DesignVariant = z.infer<typeof DesignVariantSchema>;

export const DesignJobSchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  brand_kit_id: z.string().uuid(),
  nome: z.string().min(1),
  cliente_nome: z.string().min(1),
  objetivo: z.string().min(1),
  status: DesignJobStatusSchema.default('briefing'),
  requested_formats: z.array(z.string().min(1)).min(1),
  variants: z.array(DesignVariantSchema).min(1),
  briefing_text: z.string().min(1),
  tone: z.string().min(1),
  notes: z.string().optional(),
  created_by: z.string().min(1),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  approved_at: z.string().optional(),
});
export type DesignJob = z.infer<typeof DesignJobSchema>;

export const ReviewRuleKeySchema = z.enum([
  'no_links',
  'no_spam_words',
  'correct_proportions',
  'safe_zone',
  'brand_colors',
  'logo_visibility',
  'text_legibility',
  'spam_ratio',
]);
export type ReviewRuleKey = z.infer<typeof ReviewRuleKeySchema>;

export const ReviewRuleResultSchema = z.object({
  key: ReviewRuleKeySchema,
  status: z.enum(['pass', 'warn', 'fail']),
  detail: z.string().min(1),
  metric_label: z.string().optional(),
  metric_value: z.string().optional(),
});
export type ReviewRuleResult = z.infer<typeof ReviewRuleResultSchema>;

export const DesignReviewPackSchema = z.object({
  job_id: z.string().uuid(),
  variant_id: z.string().uuid(),
  overall_status: z.enum(['approved', 'warn', 'blocked']),
  delta_e: z.number().nonnegative(),
  rules: z.array(ReviewRuleResultSchema).length(8),
});
export type DesignReviewPack = z.infer<typeof DesignReviewPackSchema>;

export const DeliverableSchema = z.object({
  id: z.string().uuid().optional(),
  job_id: z.string().uuid(),
  variant_id: z.string().uuid(),
  format: z.enum(['png', 'jpg', 'pdf', 'pptx', 'zip']),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  status: z.enum(['rascunho', 'pronto', 'aprovado', 'publicado']),
  file_url: z.string().url(),
});
export type Deliverable = z.infer<typeof DeliverableSchema>;

export const DesignTemplateSchema = z.object({
  id: z.string().uuid().optional(),
  nome: z.string().min(1),
  tipo: z.enum(['social', 'ads', 'identity', 'docs']),
  format_slugs: z.array(z.string().min(1)).min(1),
  summary: z.string().min(1),
  dynamic_tokens: z.array(z.string()).default([]),
});
export type DesignTemplate = z.infer<typeof DesignTemplateSchema>;

export const DesignAgentSlotSchema = z.object({
  slot: z.enum(['compositor', 'asset_finder', 'revisor']),
  title: z.string().min(1),
  description: z.string().min(1),
  status: z.enum(['idle', 'processing', 'error']),
  model: z.string().min(1),
});
export type DesignAgentSlot = z.infer<typeof DesignAgentSlotSchema>;

export const DesignActivityLogSchema = z.object({
  id: z.string().uuid().optional(),
  agent: z.string().min(1),
  level: z.enum(['info', 'warn', 'error']),
  message: z.string().min(1),
  timestamp: z.string(),
});
export type DesignActivityLog = z.infer<typeof DesignActivityLogSchema>;

export const DesignDashboardKpisSchema = z.object({
  clientes_ativos: z.number().int().nonnegative(),
  brand_kits_ativos: z.number().int().nonnegative(),
  jobs_ativos: z.number().int().nonnegative(),
  artes_prontas: z.number().int().nonnegative(),
  taxa_aprovacao: z.number().nonnegative(),
  formatos_catalogados: z.number().int().nonnegative(),
  templates_ativos: z.number().int().nonnegative(),
});
export type DesignDashboardKpis = z.infer<typeof DesignDashboardKpisSchema>;

export const DesignSalesApprovalSchema = z.object({
  arte_id: z.string().uuid(),
  status: z.enum(['aprovado', 'publicado']),
  approved_at: z.string(),
  approved_by: z.string(),
  urls: z.object({
    png: z.string().url().optional(),
    jpg: z.string().url().optional(),
    pdf: z.string().url().optional(),
  }),
  dimensoes: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }),
  formato: z.string().min(1),
});
export type DesignSalesApproval = z.infer<typeof DesignSalesApprovalSchema>;

export const DesignWebhookPreviewSchema = z.object({
  event: z.literal('brand_kit.updated'),
  signature: z.string().min(1),
  payload: z.object({
    brand_kit_id: z.string().uuid(),
    empresa_id: z.string().uuid(),
    cliente_nome: z.string().min(1),
    versao: z.number().int().positive(),
    updated_at: z.string(),
    changed_fields: z.array(z.string().min(1)),
    alterado_por: z.string().min(1),
  }),
  body: z.object({
    event: z.literal('brand_kit.updated'),
    data: z.object({
      brand_kit_id: z.string().uuid(),
      empresa_id: z.string().uuid(),
      cliente_nome: z.string().min(1),
      versao: z.number().int().positive(),
      updated_at: z.string(),
      changed_fields: z.array(z.string().min(1)),
      alterado_por: z.string().min(1),
    }),
  }),
});
export type DesignWebhookPreview = z.infer<typeof DesignWebhookPreviewSchema>;

export const DesignExportRequestSchema = z.object({
  format: z.enum(['png', 'jpg', 'pdf', 'pptx', 'zip']),
});
export type DesignExportRequest = z.infer<typeof DesignExportRequestSchema>;

export const DesignJobsQuerySchema = z.object({
  busca: z.string().optional(),
  status: z.array(DesignJobStatusSchema).optional(),
  brand_kit_id: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().positive().max(100).default(20),
});
export type DesignJobsQuery = z.infer<typeof DesignJobsQuerySchema>;

export const DesignModuleSnapshotSchema = z.object({
  kpis: DesignDashboardKpisSchema,
  formats: z.array(DesignFormatSchema),
  brand_kits: z.array(BrandKitSchema),
  jobs: z.array(DesignJobSchema),
  templates: z.array(DesignTemplateSchema),
  agent_slots: z.array(DesignAgentSlotSchema),
  activity_log: z.array(DesignActivityLogSchema),
  deliverables: z.array(DeliverableSchema),
  review_packs: z.array(DesignReviewPackSchema),
});
export type DesignModuleSnapshot = z.infer<typeof DesignModuleSnapshotSchema>;
