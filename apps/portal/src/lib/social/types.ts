import { z } from 'zod';

export const SocialNetworkSchema = z.enum([
  'instagram',
  'facebook',
  'linkedin',
  'tiktok',
  'twitter_x',
  'youtube',
  'pinterest',
  'whatsapp',
]);
export type SocialNetwork = z.infer<typeof SocialNetworkSchema>;

export const SocialJobStatusSchema = z.enum([
  'fila',
  'brand_kit',
  'templates',
  'assets',
  'composicao',
  'render',
  'quality_check',
  'storage',
  'revisao',
  'pronta',
  'erro',
]);
export type SocialJobStatus = z.infer<typeof SocialJobStatusSchema>;

export const PipelineStepStatusSchema = z.enum(['pending', 'active', 'completed', 'warning', 'failed']);
export type PipelineStepStatus = z.infer<typeof PipelineStepStatusSchema>;

export const ArteStatusSchema = z.enum(['pending', 'rendered', 'quality_warning', 'ready', 'error']);
export type ArteStatus = z.infer<typeof ArteStatusSchema>;

export const QualityOutcomeSchema = z.enum(['approved', 'warning', 'rejected']);
export type QualityOutcome = z.infer<typeof QualityOutcomeSchema>;

export const SafeZoneSchema = z.object({
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  note: z.string(),
});
export type SafeZone = z.infer<typeof SafeZoneSchema>;

export const FileLimitSchema = z.object({
  png_max_bytes: z.number().int().positive(),
  jpg_max_bytes: z.number().int().positive(),
  max_resolution_label: z.string(),
});
export type FileLimit = z.infer<typeof FileLimitSchema>;

export const FormatSpecSchema = z.object({
  slug: z.string().min(1),
  network: SocialNetworkSchema,
  name: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  aspect_ratio: z.string().min(1),
  safe_zone: SafeZoneSchema,
  typical_use: z.string().min(1),
  file_limits: FileLimitSchema,
});
export type FormatSpec = z.infer<typeof FormatSpecSchema>;

export const BrandPaletteSchema = z.object({
  primary: z.string(),
  secondary: z.string(),
  accent: z.string(),
  background: z.string(),
  text: z.string(),
});
export type BrandPalette = z.infer<typeof BrandPaletteSchema>;

export const BrandFontsSchema = z.object({
  heading: z.string(),
  body: z.string(),
});
export type BrandFonts = z.infer<typeof BrandFontsSchema>;

export const BrandLogosSchema = z.object({
  light: z.string(),
  dark: z.string(),
  favicon: z.string(),
});
export type BrandLogos = z.infer<typeof BrandLogosSchema>;

export const BrandKitCacheEntrySchema = z.object({
  id: z.string().uuid(),
  company_id: z.string().uuid(),
  product_name: z.string().min(1),
  source: z.literal('fbr-design'),
  palette: BrandPaletteSchema,
  fonts: BrandFontsSchema,
  logos: BrandLogosSchema,
  guidelines: z.array(z.string()).default([]),
  restrictions: z.array(z.string()).default([]),
  cached_at: z.string(),
  source_updated_at: z.string(),
  stale: z.boolean().default(false),
  stale_reason: z.string().optional(),
});
export type BrandKitCacheEntry = z.infer<typeof BrandKitCacheEntrySchema>;

export const TemplateLayerSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['background', 'image', 'text', 'cta']),
  placeholder: z.string().optional(),
  x: z.union([z.number(), z.string()]),
  y: z.union([z.number(), z.string()]),
  width: z.union([z.number(), z.string()]),
  height: z.union([z.number(), z.string()]).optional(),
  safe_zone: z.boolean().default(false),
});
export type TemplateLayer = z.infer<typeof TemplateLayerSchema>;

export const TemplateConfigSchema = z.object({
  template_id: z.string().min(1),
  version: z.number().int().positive(),
  network: SocialNetworkSchema,
  format_slug: z.string().min(1),
  dimensions: z.object({ width: z.number().int().positive(), height: z.number().int().positive() }),
  layers: z.array(TemplateLayerSchema).min(1),
  global_styles: z.record(z.string()),
});
export type TemplateConfig = z.infer<typeof TemplateConfigSchema>;

export const SocialTemplateSchema = z.object({
  id: z.string().uuid(),
  company_id: z.string().uuid(),
  brand_kit_id: z.string().uuid(),
  name: z.string().min(1),
  network: SocialNetworkSchema,
  format_slug: z.string().min(1),
  content_type: z.string().min(1),
  version: z.number().int().positive(),
  active: z.boolean().default(true),
  config: TemplateConfigSchema,
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().optional(),
});
export type SocialTemplate = z.infer<typeof SocialTemplateSchema>;

export const SocialJobSchema = z.object({
  id: z.string().uuid(),
  company_id: z.string().uuid(),
  product_name: z.string().min(1),
  brand_kit_id: z.string().uuid(),
  content_type: z.string().min(1),
  tone: z.string().min(1),
  headline: z.string().min(1),
  subheadline: z.string().min(1),
  cta_text: z.string().min(1),
  target_networks: z.array(SocialNetworkSchema).min(1),
  format_slugs: z.array(z.string().min(1)).min(1),
  status: SocialJobStatusSchema,
  queue_position: z.number().int().min(0),
  eta_minutes: z.number().int().min(0),
  origin_module: z.string().default('fbr-portal'),
  created_by: z.string().min(1),
  created_at: z.string(),
  updated_at: z.string(),
});
export type SocialJob = z.infer<typeof SocialJobSchema>;

export const SocialArteSchema = z.object({
  id: z.string().uuid(),
  job_id: z.string().uuid(),
  company_id: z.string().uuid(),
  network: SocialNetworkSchema,
  format_slug: z.string().min(1),
  template_id: z.string().uuid(),
  version: z.number().int().positive(),
  status: ArteStatusSchema,
  ext: z.enum(['png', 'jpg']),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  size_bytes: z.number().int().positive(),
  file_name: z.string().min(1),
  file_path: z.string().min(1),
  preview_url: z.string().url(),
  device_mockup: z.string().min(1),
  created_at: z.string(),
});
export type SocialArte = z.infer<typeof SocialArteSchema>;

export const QualityCheckSchema = z.object({
  id: z.string().uuid(),
  arte_id: z.string().uuid(),
  dimensions_ok: z.boolean(),
  safe_zone_ok: z.boolean(),
  file_size_ok: z.boolean(),
  contrast_ok: z.boolean(),
  logo_ok: z.boolean(),
  contrast_ratio: z.number().positive(),
  outcome: QualityOutcomeSchema,
  notes: z.array(z.string()).default([]),
  checked_at: z.string(),
});
export type QualityCheck = z.infer<typeof QualityCheckSchema>;

export const PackageManifestFileSchema = z.object({
  network: SocialNetworkSchema,
  format_slug: z.string().min(1),
  file: z.string().min(1),
  dimensions: z.string().min(1),
  size_bytes: z.number().int().positive(),
});
export type PackageManifestFile = z.infer<typeof PackageManifestFileSchema>;

export const PackageManifestSchema = z.object({
  job_id: z.string().uuid(),
  product_name: z.string().min(1),
  generated_at: z.string(),
  networks: z.array(SocialNetworkSchema).min(1),
  files: z.array(PackageManifestFileSchema),
  total_files: z.number().int().min(0),
  total_size_bytes: z.number().int().min(0),
});
export type PackageManifest = z.infer<typeof PackageManifestSchema>;

export const SocialAgentSlotSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: z.string().min(1),
  cadence: z.string().min(1),
  status: z.enum(['online', 'offline', 'gerando']),
  summary: z.string().min(1),
});
export type SocialAgentSlot = z.infer<typeof SocialAgentSlotSchema>;

export const SocialAgentEventSchema = z.object({
  id: z.string().uuid(),
  event: z.enum(['job_started', 'arte_generated', 'quality_warning', 'job_completed', 'cache_invalidated']),
  message: z.string().min(1),
  job_id: z.string().uuid().optional(),
  progress: z.number().int().min(0).max(100).optional(),
  occurred_at: z.string(),
});
export type SocialAgentEvent = z.infer<typeof SocialAgentEventSchema>;

export const SocialJobsQuerySchema = z.object({
  search: z.string().optional(),
  network: z.array(SocialNetworkSchema).optional(),
  status: z.array(SocialJobStatusSchema).optional(),
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().positive().max(100).default(20),
});
export type SocialJobsQuery = z.infer<typeof SocialJobsQuerySchema>;

export const SocialTemplatesQuerySchema = z.object({
  network: z.array(SocialNetworkSchema).optional(),
  include_inactive: z.coerce.boolean().default(false),
});
export type SocialTemplatesQuery = z.infer<typeof SocialTemplatesQuerySchema>;

export const SocialGalleryQuerySchema = z.object({
  network: z.array(SocialNetworkSchema).optional(),
  status: z.array(ArteStatusSchema).optional(),
});
export type SocialGalleryQuery = z.infer<typeof SocialGalleryQuerySchema>;

export const PipelineStepSnapshotSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().min(1),
  status: PipelineStepStatusSchema,
});
export type PipelineStepSnapshot = z.infer<typeof PipelineStepSnapshotSchema>;

export const SocialKpiSchema = z.object({
  jobs_hoje: z.number().int().min(0),
  artes_geradas: z.number().int().min(0),
  aprovadas: z.number().int().min(0),
  pendentes: z.number().int().min(0),
  redes_ativas: z.number().int().min(0),
  formatos_suportados: z.number().int().min(0),
});
export type SocialKpi = z.infer<typeof SocialKpiSchema>;

export const NetworkFormatGroupSchema = z.object({
  network: SocialNetworkSchema,
  label: z.string().min(1),
  format_count: z.number().int().min(0),
  formats: z.array(FormatSpecSchema),
});
export type NetworkFormatGroup = z.infer<typeof NetworkFormatGroupSchema>;

export const SocialDashboardSnapshotSchema = z.object({
  kpis: SocialKpiSchema,
  network_matrix: z.array(NetworkFormatGroupSchema),
  pipeline: z.array(PipelineStepSnapshotSchema),
  jobs: z.array(SocialJobSchema),
  artefacts: z.array(SocialArteSchema),
  quality_checks: z.array(QualityCheckSchema),
  templates: z.array(SocialTemplateSchema),
  brand_kits: z.array(BrandKitCacheEntrySchema),
  agent_slots: z.array(SocialAgentSlotSchema),
  agent_events: z.array(SocialAgentEventSchema),
  package_preview: PackageManifestSchema.nullable(),
});
export type SocialDashboardSnapshot = z.infer<typeof SocialDashboardSnapshotSchema>;

export const BrandKitWebhookPayloadSchema = z.object({
  brand_kit_id: z.string().uuid().optional(),
  updated_at: z.string().optional(),
  event: z.literal('brand_kit.updated').optional(),
  data: z.object({
    brand_kit_id: z.string().uuid(),
    versao: z.number().int().optional(),
    alteracoes: z.array(z.string()).optional(),
    alterado_por: z.string().optional(),
  }).optional(),
});
export type BrandKitWebhookPayload = z.infer<typeof BrandKitWebhookPayloadSchema>;
