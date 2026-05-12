import { createHmac } from 'node:crypto';
import { z } from 'zod';
import type { ArvaAgent } from '@fbr/arva-integration';
import {
  BrandKitCacheEntry,
  BrandKitWebhookPayload,
  BrandKitWebhookPayloadSchema,
  FormatSpec,
  FormatSpecSchema,
  NetworkFormatGroup,
  PackageManifest,
  PipelineStepSnapshot,
  QualityCheck,
  QualityCheckSchema,
  SocialPackagePreview,
  SocialAgentEvent,
  SocialAgentSlot,
  SocialArte,
  SocialDashboardSnapshot,
  SocialGalleryQuery,
  SocialGalleryQuerySchema,
  SocialJob,
  SocialJobsQuery,
  SocialJobsQuerySchema,
  SocialJobStatus,
  SocialKpi,
  SocialNetwork,
  SocialTemplate,
  SocialTemplatesQuery,
  SocialTemplatesQuerySchema,
  TemplateConfig,
} from './types';

export interface SocialRequestContext {
  companyId: string;
  userId: string;
  moduleSource: string;
  role?: string;
}

export class SocialValidationError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 401 | 403 | 404 | 409 | 422,
    readonly issues?: unknown,
  ) {
    super(message);
  }
}

const COMPANY_ALPHA = '11111111-1111-4111-8111-111111111111';
const USER_SYSTEM = '33333333-3333-4333-8333-333333333333';
const WEBHOOK_SECRET = 'design-social-secret';

const nowIso = () => new Date('2026-05-08T12:00:00.000Z').toISOString();
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const feedLimit = { png_max_bytes: 8_000_000, jpg_max_bytes: 2_000_000, max_resolution_label: '1080x1920' } as const;
const coverLimit = { png_max_bytes: 6_000_000, jpg_max_bytes: 1_500_000, max_resolution_label: '2560x1440' } as const;
const thumbLimit = { png_max_bytes: 4_000_000, jpg_max_bytes: 1_000_000, max_resolution_label: '800x800' } as const;

const formatCatalogSeed: FormatSpec[] = [
  { slug: 'ig-feed-square', network: 'instagram', name: 'Feed Quadrado', width: 1080, height: 1080, aspect_ratio: '1:1', safe_zone: { x: 40, y: 40, width: 1000, height: 1000, note: 'Conteudo essencial dentro da area quadrada segura.' }, typical_use: 'Post de feed', file_limits: feedLimit },
  { slug: 'ig-feed-portrait', network: 'instagram', name: 'Feed Retrato', width: 1080, height: 1350, aspect_ratio: '4:5', safe_zone: { x: 40, y: 50, width: 1000, height: 1250, note: 'Evitar CTA muito rente a base.' }, typical_use: 'Feed com maior alcance', file_limits: feedLimit },
  { slug: 'ig-feed-landscape', network: 'instagram', name: 'Feed Landscape', width: 1080, height: 566, aspect_ratio: '1.91:1', safe_zone: { x: 50, y: 50, width: 980, height: 466, note: 'Margem extra nas laterais para recorte.' }, typical_use: 'Post paisagem', file_limits: feedLimit },
  { slug: 'ig-stories', network: 'instagram', name: 'Stories', width: 1080, height: 1920, aspect_ratio: '9:16', safe_zone: { x: 40, y: 110, width: 1000, height: 1700, note: 'Manter 250px no topo e 400px na base livres.' }, typical_use: 'Stories e enquetes', file_limits: feedLimit },
  { slug: 'ig-reels', network: 'instagram', name: 'Reels', width: 1080, height: 1920, aspect_ratio: '9:16', safe_zone: { x: 40, y: 110, width: 1000, height: 1700, note: 'Overlay seguro para interface do app.' }, typical_use: 'Capa de Reels', file_limits: feedLimit },
  { slug: 'ig-carousel', network: 'instagram', name: 'Carousel', width: 1080, height: 1080, aspect_ratio: '1:1', safe_zone: { x: 40, y: 40, width: 1000, height: 1000, note: 'Mantem consistencia entre slides.' }, typical_use: 'Carrossel', file_limits: feedLimit },
  { slug: 'ig-profile', network: 'instagram', name: 'Profile Pic', width: 320, height: 320, aspect_ratio: '1:1', safe_zone: { x: 20, y: 20, width: 280, height: 280, note: 'Conteudo critico dentro do circulo inscrito.' }, typical_use: 'Avatar', file_limits: thumbLimit },
  { slug: 'ig-highlight', network: 'instagram', name: 'Highlight Cover', width: 1080, height: 1920, aspect_ratio: '9:16', safe_zone: { x: 340, y: 760, width: 400, height: 400, note: 'Elemento principal centralizado.' }, typical_use: 'Capa de destaque', file_limits: feedLimit },
  { slug: 'fb-post', network: 'facebook', name: 'Post', width: 1200, height: 630, aspect_ratio: '1.91:1', safe_zone: { x: 60, y: 50, width: 1080, height: 530, note: 'Evitar bordas laterais para preview.' }, typical_use: 'Feed do Facebook', file_limits: coverLimit },
  { slug: 'fb-post-square', network: 'facebook', name: 'Post Quadrado', width: 1080, height: 1080, aspect_ratio: '1:1', safe_zone: { x: 50, y: 50, width: 980, height: 980, note: 'Seguro para compartilhamentos.' }, typical_use: 'Feed quadrado', file_limits: feedLimit },
  { slug: 'fb-cover', network: 'facebook', name: 'Cover', width: 820, height: 312, aspect_ratio: '2.63:1', safe_zone: { x: 90, y: 0, width: 640, height: 312, note: 'Base esquerda sofre interferencia da foto de perfil.' }, typical_use: 'Capa da pagina', file_limits: coverLimit },
  { slug: 'fb-stories', network: 'facebook', name: 'Stories', width: 1080, height: 1920, aspect_ratio: '9:16', safe_zone: { x: 40, y: 110, width: 1000, height: 1700, note: 'Mesmo envelope de stories do Instagram.' }, typical_use: 'Facebook Stories', file_limits: feedLimit },
  { slug: 'fb-event', network: 'facebook', name: 'Event Cover', width: 1920, height: 1005, aspect_ratio: '1.91:1', safe_zone: { x: 100, y: 100, width: 1720, height: 805, note: 'Manter titulo dentro da area central.' }, typical_use: 'Capa de evento', file_limits: coverLimit },
  { slug: 'fb-profile', network: 'facebook', name: 'Profile Pic', width: 170, height: 170, aspect_ratio: '1:1', safe_zone: { x: 10, y: 10, width: 150, height: 150, note: 'Conteudo legivel em circulo pequeno.' }, typical_use: 'Avatar', file_limits: thumbLimit },
  { slug: 'fb-thumb-link', network: 'facebook', name: 'Thumbnail Link', width: 1200, height: 628, aspect_ratio: '1.91:1', safe_zone: { x: 60, y: 50, width: 1080, height: 528, note: 'Otimizado para preview compartilhado.' }, typical_use: 'Preview de link', file_limits: thumbLimit },
  { slug: 'li-post', network: 'linkedin', name: 'Post', width: 1200, height: 627, aspect_ratio: '1.91:1', safe_zone: { x: 60, y: 50, width: 1080, height: 527, note: 'Headline dentro do bloco central.' }, typical_use: 'Feed profissional', file_limits: coverLimit },
  { slug: 'li-post-square', network: 'linkedin', name: 'Post Quadrado', width: 1080, height: 1080, aspect_ratio: '1:1', safe_zone: { x: 60, y: 60, width: 960, height: 960, note: 'Espaco extra para legendas da plataforma.' }, typical_use: 'Feed quadrado', file_limits: feedLimit },
  { slug: 'li-post-portrait', network: 'linkedin', name: 'Post Retrato', width: 1080, height: 1350, aspect_ratio: '4:5', safe_zone: { x: 60, y: 70, width: 960, height: 1210, note: 'Mantem CTA distante da borda inferior.' }, typical_use: 'Storytelling vertical', file_limits: feedLimit },
  { slug: 'li-banner', network: 'linkedin', name: 'Banner', width: 1584, height: 396, aspect_ratio: '4:1', safe_zone: { x: 92, y: 48, width: 1400, height: 300, note: 'Areas laterais sofrem crop em mobile.' }, typical_use: 'Capa de perfil', file_limits: coverLimit },
  { slug: 'li-company-cover', network: 'linkedin', name: 'Company Cover', width: 1128, height: 191, aspect_ratio: '5.9:1', safe_zone: { x: 84, y: 16, width: 960, height: 160, note: 'Zona segura extremamente horizontal.' }, typical_use: 'Capa da empresa', file_limits: coverLimit },
  { slug: 'li-doc-cover', network: 'linkedin', name: 'Document Cover', width: 1200, height: 627, aspect_ratio: '1.91:1', safe_zone: { x: 60, y: 50, width: 1080, height: 527, note: 'Usado para carrossel/documento.' }, typical_use: 'Capa de documento', file_limits: coverLimit },
  { slug: 'li-profile', network: 'linkedin', name: 'Profile Pic', width: 400, height: 400, aspect_ratio: '1:1', safe_zone: { x: 20, y: 20, width: 360, height: 360, note: 'Foto dentro do circulo inscrito.' }, typical_use: 'Avatar', file_limits: thumbLimit },
  { slug: 'tt-vertical', network: 'tiktok', name: 'Vertical', width: 1080, height: 1920, aspect_ratio: '9:16', safe_zone: { x: 60, y: 110, width: 960, height: 1700, note: 'Reservar overlay para legenda e CTA nativo.' }, typical_use: 'Video ou thumbnail principal', file_limits: feedLimit },
  { slug: 'tt-thumb', network: 'tiktok', name: 'Thumbnail', width: 1080, height: 1920, aspect_ratio: '9:16', safe_zone: { x: 60, y: 110, width: 960, height: 1700, note: 'Evitar texto atras de controles.' }, typical_use: 'Capa do video', file_limits: feedLimit },
  { slug: 'tt-profile', network: 'tiktok', name: 'Profile Pic', width: 200, height: 200, aspect_ratio: '1:1', safe_zone: { x: 10, y: 10, width: 180, height: 180, note: 'Centro mais importante que bordas.' }, typical_use: 'Avatar', file_limits: thumbLimit },
  { slug: 'tt-cover', network: 'tiktok', name: 'Cover', width: 1080, height: 1920, aspect_ratio: '9:16', safe_zone: { x: 60, y: 110, width: 960, height: 1700, note: 'Ideal para playlist e series.' }, typical_use: 'Capa de album', file_limits: feedLimit },
  { slug: 'tw-post', network: 'twitter_x', name: 'Post', width: 1600, height: 900, aspect_ratio: '16:9', safe_zone: { x: 100, y: 75, width: 1400, height: 750, note: 'Seguro para timeline e embeds.' }, typical_use: 'Tweet com imagem', file_limits: coverLimit },
  { slug: 'tw-post-square', network: 'twitter_x', name: 'Post Quadrado', width: 1080, height: 1080, aspect_ratio: '1:1', safe_zone: { x: 60, y: 60, width: 960, height: 960, note: 'Leitura priorizada no centro.' }, typical_use: 'Tweet quadrado', file_limits: feedLimit },
  { slug: 'tw-header', network: 'twitter_x', name: 'Header', width: 1500, height: 500, aspect_ratio: '3:1', safe_zone: { x: 100, y: 50, width: 1300, height: 400, note: 'Evitar area inferior esquerda do avatar.' }, typical_use: 'Header de perfil', file_limits: coverLimit },
  { slug: 'tw-thumb', network: 'twitter_x', name: 'Thumbnail', width: 800, height: 418, aspect_ratio: '1.91:1', safe_zone: { x: 50, y: 39, width: 700, height: 340, note: 'Preview de link compartilhado.' }, typical_use: 'Card de link', file_limits: thumbLimit },
  { slug: 'tw-profile', network: 'twitter_x', name: 'Profile Pic', width: 400, height: 400, aspect_ratio: '1:1', safe_zone: { x: 25, y: 25, width: 350, height: 350, note: 'Conteudo seguro no circulo.' }, typical_use: 'Avatar', file_limits: thumbLimit },
  { slug: 'yt-thumb', network: 'youtube', name: 'Thumbnail', width: 1280, height: 720, aspect_ratio: '16:9', safe_zone: { x: 70, y: 50, width: 1140, height: 620, note: 'Headline longe do canto inferior direito.' }, typical_use: 'Thumbnail de video', file_limits: coverLimit },
  { slug: 'yt-channel', network: 'youtube', name: 'Channel Art', width: 2560, height: 1440, aspect_ratio: '16:9', safe_zone: { x: 507, y: 509, width: 1546, height: 423, note: 'Area segura central do desktop.' }, typical_use: 'Arte do canal', file_limits: coverLimit },
  { slug: 'yt-shorts-thumb', network: 'youtube', name: 'Shorts Thumb', width: 1080, height: 1920, aspect_ratio: '9:16', safe_zone: { x: 60, y: 110, width: 960, height: 1700, note: 'Mesmo envelope seguro do vertical.' }, typical_use: 'Thumbnail de Shorts', file_limits: feedLimit },
  { slug: 'yt-profile', network: 'youtube', name: 'Profile Pic', width: 800, height: 800, aspect_ratio: '1:1', safe_zone: { x: 50, y: 50, width: 700, height: 700, note: 'Avatar dentro do circulo.' }, typical_use: 'Avatar', file_limits: thumbLimit },
  { slug: 'yt-community', network: 'youtube', name: 'Community Post', width: 1200, height: 675, aspect_ratio: '16:9', safe_zone: { x: 70, y: 50, width: 1060, height: 575, note: 'Adequado para feed da comunidade.' }, typical_use: 'Post da comunidade', file_limits: coverLimit },
  { slug: 'pin-vertical', network: 'pinterest', name: 'Pin Vertical', width: 1000, height: 1500, aspect_ratio: '2:3', safe_zone: { x: 50, y: 75, width: 900, height: 1350, note: 'Headline centralizada para descoberta.' }, typical_use: 'Pin padrao', file_limits: feedLimit },
  { slug: 'pin-square', network: 'pinterest', name: 'Pin Quadrado', width: 1000, height: 1000, aspect_ratio: '1:1', safe_zone: { x: 50, y: 50, width: 900, height: 900, note: 'Seguro para resultados quadrados.' }, typical_use: 'Pin quadrado', file_limits: feedLimit },
  { slug: 'pin-wide', network: 'pinterest', name: 'Pin Largo', width: 1080, height: 1920, aspect_ratio: '9:16', safe_zone: { x: 60, y: 110, width: 960, height: 1700, note: 'Ideal para idea pins.' }, typical_use: 'Idea Pin', file_limits: feedLimit },
  { slug: 'pin-story', network: 'pinterest', name: 'Story Pin', width: 1080, height: 1920, aspect_ratio: '9:16', safe_zone: { x: 60, y: 110, width: 960, height: 1700, note: 'Sequencia em storytelling vertical.' }, typical_use: 'Story pin', file_limits: feedLimit },
  { slug: 'pin-profile', network: 'pinterest', name: 'Profile Pic', width: 165, height: 165, aspect_ratio: '1:1', safe_zone: { x: 10, y: 10, width: 145, height: 145, note: 'Leitura segura em circulo pequeno.' }, typical_use: 'Avatar', file_limits: thumbLimit },
  { slug: 'wa-status', network: 'whatsapp', name: 'Status', width: 1080, height: 1920, aspect_ratio: '9:16', safe_zone: { x: 60, y: 110, width: 960, height: 1700, note: 'Status com areas livres para UI.' }, typical_use: 'Status do WhatsApp', file_limits: feedLimit },
  { slug: 'wa-link-preview', network: 'whatsapp', name: 'Link Preview', width: 800, height: 418, aspect_ratio: '1.91:1', safe_zone: { x: 50, y: 39, width: 700, height: 340, note: 'Preview compartilhado em conversa.' }, typical_use: 'Link preview', file_limits: thumbLimit },
  { slug: 'wa-sticker', network: 'whatsapp', name: 'Sticker', width: 512, height: 512, aspect_ratio: '1:1', safe_zone: { x: 31, y: 31, width: 450, height: 450, note: 'Importante manter respiro nas bordas.' }, typical_use: 'Sticker personalizado', file_limits: thumbLimit },
  { slug: 'wa-profile', network: 'whatsapp', name: 'Profile Pic', width: 500, height: 500, aspect_ratio: '1:1', safe_zone: { x: 30, y: 30, width: 440, height: 440, note: 'Avatar em circulo de grupo.' }, typical_use: 'Avatar de grupo', file_limits: thumbLimit },
  { slug: 'wa-cover', network: 'whatsapp', name: 'Cover', width: 640, height: 360, aspect_ratio: '16:9', safe_zone: { x: 40, y: 30, width: 560, height: 300, note: 'Capa de canal com respiro lateral.' }, typical_use: 'Capa de canal', file_limits: coverLimit },
].map((spec) => FormatSpecSchema.parse(spec));

const sourceBrandKitsSeed: BrandKitCacheEntry[] = [
  {
    id: 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    company_id: COMPANY_ALPHA,
    product_name: 'Imovel Top',
    source: 'fbr-design',
    palette: { primary: '#1E3A5F', secondary: '#4ECDC4', accent: '#EC4899', background: '#F7F7F7', text: '#10243A' },
    fonts: { heading: 'Outfit', body: 'Inter' },
    logos: { light: 'https://cdn.facebrasil.com/imoveltop/logo-light.png', dark: 'https://cdn.facebrasil.com/imoveltop/logo-dark.png', favicon: 'https://cdn.facebrasil.com/imoveltop/favicon.png' },
    guidelines: ['Usar headline curta e CTA claro.', 'Preferir blocos visuais com respiro de 24px.'],
    restrictions: ['Nao inverter as cores primarias.', 'Nao distorcer a assinatura visual.'],
    cached_at: '2026-05-08T08:00:00.000Z',
    source_updated_at: '2026-05-08T07:30:00.000Z',
    stale: false,
  },
  {
    id: 'aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
    company_id: COMPANY_ALPHA,
    product_name: 'Facebrasil News',
    source: 'fbr-design',
    palette: { primary: '#172033', secondary: '#F59E0B', accent: '#EC4899', background: '#F5F7FB', text: '#0F172A' },
    fonts: { heading: 'Outfit', body: 'IBM Plex Sans' },
    logos: { light: 'https://cdn.facebrasil.com/news/logo-light.png', dark: 'https://cdn.facebrasil.com/news/logo-dark.png', favicon: 'https://cdn.facebrasil.com/news/favicon.png' },
    guidelines: ['Priorizar legibilidade de titulos.', 'Imagem hero sempre com overlay de marca.'],
    restrictions: ['Nao usar mais de 2 familias tipograficas.', 'Nao mover logo para fora da safe zone.'],
    cached_at: '2026-05-07T09:00:00.000Z',
    source_updated_at: '2026-05-07T09:00:00.000Z',
    stale: false,
  },
  {
    id: 'aaaaaaa3-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
    company_id: COMPANY_ALPHA,
    product_name: 'Portal Premium',
    source: 'fbr-design',
    palette: { primary: '#0D0D0D', secondary: '#C9A84C', accent: '#EC4899', background: '#FAF7F0', text: '#111111' },
    fonts: { heading: 'Playfair Display', body: 'Lato' },
    logos: { light: 'https://cdn.facebrasil.com/premium/logo-light.png', dark: 'https://cdn.facebrasil.com/premium/logo-dark.png', favicon: 'https://cdn.facebrasil.com/premium/favicon.png' },
    guidelines: ['Aplicar luxo editorial com muito respiro.', 'Contraste sempre acima de 7:1 em headlines.'],
    restrictions: ['Nao usar degradês neon.', 'Nao aplicar mais de um CTA por arte.'],
    cached_at: '2026-05-06T10:00:00.000Z',
    source_updated_at: '2026-05-06T10:00:00.000Z',
    stale: false,
  },
];

function createTemplateConfig(templateId: string, version: number, network: SocialNetwork, formatSlug: string, width: number, height: number): TemplateConfig {
  return {
    template_id: templateId,
    version,
    network,
    format_slug: formatSlug,
    dimensions: { width, height },
    layers: [
      { id: 'background', type: 'background', x: 0, y: 0, width: '100%', height: '100%', safe_zone: false },
      { id: 'logo', type: 'image', placeholder: '{{logo_url}}', x: 'center', y: 72, width: 180, height: 72, safe_zone: false },
      { id: 'headline', type: 'text', placeholder: '{{headline}}', x: 'center', y: 'center-24', width: 840, safe_zone: true },
      { id: 'subheadline', type: 'text', placeholder: '{{subheadline}}', x: 'center', y: 'center+56', width: 760, safe_zone: true },
      { id: 'cta', type: 'cta', placeholder: '{{cta_text}}', x: 'center', y: 'bottom-110', width: 320, safe_zone: true },
    ],
    global_styles: {
      font_heading: '{{font_heading}}',
      font_body: '{{font_body}}',
      primary_color: '{{primary_color}}',
      text_color: '{{text_color}}',
      accent_color: '{{accent_color}}',
    },
  };
}

const initialTemplatesSeed: SocialTemplate[] = [
  { id: 'bbbbbbb1-bbbb-4bbb-8bbb-bbbbbbbbbbb1', company_id: COMPANY_ALPHA, brand_kit_id: 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1', name: 'IG Square Launch v1', network: 'instagram', format_slug: 'ig-feed-square', content_type: 'lancamento', version: 1, active: false, config: createTemplateConfig('ig-feed-square-v1', 1, 'instagram', 'ig-feed-square', 1080, 1080), created_at: '2026-05-01T09:00:00.000Z', updated_at: '2026-05-01T09:00:00.000Z' },
  { id: 'bbbbbbb2-bbbb-4bbb-8bbb-bbbbbbbbbbb2', company_id: COMPANY_ALPHA, brand_kit_id: 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1', name: 'IG Square Launch v2', network: 'instagram', format_slug: 'ig-feed-square', content_type: 'lancamento', version: 2, active: true, config: createTemplateConfig('ig-feed-square-v2', 2, 'instagram', 'ig-feed-square', 1080, 1080), created_at: '2026-05-05T09:00:00.000Z', updated_at: '2026-05-05T09:00:00.000Z' },
  { id: 'bbbbbbb3-bbbb-4bbb-8bbb-bbbbbbbbbbb3', company_id: COMPANY_ALPHA, brand_kit_id: 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1', name: 'IG Stories Promo v1', network: 'instagram', format_slug: 'ig-stories', content_type: 'promocao', version: 1, active: true, config: createTemplateConfig('ig-stories-v1', 1, 'instagram', 'ig-stories', 1080, 1920), created_at: '2026-05-06T09:00:00.000Z', updated_at: '2026-05-06T09:00:00.000Z' },
  { id: 'bbbbbbb4-bbbb-4bbb-8bbb-bbbbbbbbbbb4', company_id: COMPANY_ALPHA, brand_kit_id: 'aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaa2', name: 'LinkedIn Editorial v1', network: 'linkedin', format_slug: 'li-post', content_type: 'editorial', version: 1, active: true, config: createTemplateConfig('li-post-v1', 1, 'linkedin', 'li-post', 1200, 627), created_at: '2026-05-07T08:00:00.000Z', updated_at: '2026-05-07T08:00:00.000Z' },
  { id: 'bbbbbbb5-bbbb-4bbb-8bbb-bbbbbbbbbbb5', company_id: COMPANY_ALPHA, brand_kit_id: 'aaaaaaa3-aaaa-4aaa-8aaa-aaaaaaaaaaa3', name: 'YT Thumb Premium v1', network: 'youtube', format_slug: 'yt-thumb', content_type: 'thumb', version: 1, active: true, config: createTemplateConfig('yt-thumb-v1', 1, 'youtube', 'yt-thumb', 1280, 720), created_at: '2026-05-07T11:00:00.000Z', updated_at: '2026-05-07T11:00:00.000Z' },
  { id: 'bbbbbbb6-bbbb-4bbb-8bbb-bbbbbbbbbbb6', company_id: COMPANY_ALPHA, brand_kit_id: 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1', name: 'WA Status Brand v1', network: 'whatsapp', format_slug: 'wa-status', content_type: 'atualizacao', version: 1, active: true, config: createTemplateConfig('wa-status-v1', 1, 'whatsapp', 'wa-status', 1080, 1920), created_at: '2026-05-04T12:00:00.000Z', updated_at: '2026-05-04T12:00:00.000Z' },
];

const initialJobsSeed: SocialJob[] = [
  {
    id: 'ccccccc1-cccc-4ccc-8ccc-ccccccccccc1',
    company_id: COMPANY_ALPHA,
    product_name: 'Imovel Top',
    brand_kit_id: 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    content_type: 'lancamento',
    tone: 'direto',
    headline: 'Seu proximo imovel com decisao mais rapida',
    subheadline: 'Tour virtual, CTA forte e capa pronta para feed e stories.',
    cta_text: 'Agende a visita',
    target_networks: ['instagram', 'facebook', 'linkedin'],
    format_slugs: ['ig-feed-square', 'ig-stories', 'fb-post', 'li-post'],
    status: 'revisao',
    queue_position: 0,
    eta_minutes: 0,
    origin_module: 'fbr-portal',
    created_by: USER_SYSTEM,
    created_at: '2026-05-08T09:05:00.000Z',
    updated_at: '2026-05-08T10:40:00.000Z',
  },
  {
    id: 'ccccccc2-cccc-4ccc-8ccc-ccccccccccc2',
    company_id: COMPANY_ALPHA,
    product_name: 'Facebrasil News',
    brand_kit_id: 'aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
    content_type: 'editorial',
    tone: 'informativo',
    headline: 'Cobertura local com visual pronto para redes',
    subheadline: 'Pacote editorial com LinkedIn, X e YouTube community.',
    cta_text: 'Leia a materia',
    target_networks: ['linkedin', 'twitter_x', 'youtube'],
    format_slugs: ['li-post', 'tw-post', 'yt-community'],
    status: 'quality_check',
    queue_position: 1,
    eta_minutes: 8,
    origin_module: 'fbr-redacao',
    created_by: USER_SYSTEM,
    created_at: '2026-05-08T08:10:00.000Z',
    updated_at: '2026-05-08T10:10:00.000Z',
  },
  {
    id: 'ccccccc3-cccc-4ccc-8ccc-ccccccccccc3',
    company_id: COMPANY_ALPHA,
    product_name: 'Portal Premium',
    brand_kit_id: 'aaaaaaa3-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
    content_type: 'thumb',
    tone: 'luxo editorial',
    headline: 'Mercado de alto padrao em um frame',
    subheadline: 'Thumbnail, community post e story pin coordenados.',
    cta_text: 'Ver episodio',
    target_networks: ['youtube', 'pinterest'],
    format_slugs: ['yt-thumb', 'pin-vertical', 'pin-story'],
    status: 'pronta',
    queue_position: 0,
    eta_minutes: 0,
    origin_module: 'fbr-mkt',
    created_by: USER_SYSTEM,
    created_at: '2026-05-07T17:20:00.000Z',
    updated_at: '2026-05-08T07:55:00.000Z',
  },
];

const initialArtesSeed: SocialArte[] = [
  { id: 'ddddddd1-dddd-4ddd-8ddd-ddddddddddd1', job_id: 'ccccccc1-cccc-4ccc-8ccc-ccccccccccc1', company_id: COMPANY_ALPHA, network: 'instagram', format_slug: 'ig-feed-square', template_id: 'bbbbbbb2-bbbb-4bbb-8bbb-bbbbbbbbbbb2', version: 1, status: 'ready', ext: 'png', width: 1080, height: 1080, size_bytes: 1_285_120, file_name: 'ig-feed-square_v1.png', file_path: `social/${COMPANY_ALPHA}/ccccccc1-cccc-4ccc-8ccc-ccccccccccc1/instagram/ig-feed-square_v1.png`, preview_url: 'https://cdn.facebrasil.com/social/ig-feed-square_v1.png', device_mockup: 'Feed mockup', created_at: '2026-05-08T10:00:00.000Z' },
  { id: 'ddddddd2-dddd-4ddd-8ddd-ddddddddddd2', job_id: 'ccccccc1-cccc-4ccc-8ccc-ccccccccccc1', company_id: COMPANY_ALPHA, network: 'instagram', format_slug: 'ig-stories', template_id: 'bbbbbbb3-bbbb-4bbb-8bbb-bbbbbbbbbbb3', version: 1, status: 'quality_warning', ext: 'png', width: 1080, height: 1920, size_bytes: 2_440_000, file_name: 'ig-stories_v1.png', file_path: `social/${COMPANY_ALPHA}/ccccccc1-cccc-4ccc-8ccc-ccccccccccc1/instagram/ig-stories_v1.png`, preview_url: 'https://cdn.facebrasil.com/social/ig-stories_v1.png', device_mockup: 'Stories mockup', created_at: '2026-05-08T10:05:00.000Z' },
  { id: 'ddddddd3-dddd-4ddd-8ddd-ddddddddddd3', job_id: 'ccccccc1-cccc-4ccc-8ccc-ccccccccccc1', company_id: COMPANY_ALPHA, network: 'facebook', format_slug: 'fb-post', template_id: 'bbbbbbb2-bbbb-4bbb-8bbb-bbbbbbbbbbb2', version: 1, status: 'ready', ext: 'png', width: 1200, height: 630, size_bytes: 1_508_000, file_name: 'fb-post_v1.png', file_path: `social/${COMPANY_ALPHA}/ccccccc1-cccc-4ccc-8ccc-ccccccccccc1/facebook/fb-post_v1.png`, preview_url: 'https://cdn.facebrasil.com/social/fb-post_v1.png', device_mockup: 'Facebook feed mockup', created_at: '2026-05-08T10:07:00.000Z' },
  { id: 'ddddddd4-dddd-4ddd-8ddd-ddddddddddd4', job_id: 'ccccccc1-cccc-4ccc-8ccc-ccccccccccc1', company_id: COMPANY_ALPHA, network: 'linkedin', format_slug: 'li-post', template_id: 'bbbbbbb4-bbbb-4bbb-8bbb-bbbbbbbbbbb4', version: 1, status: 'ready', ext: 'png', width: 1200, height: 627, size_bytes: 1_410_000, file_name: 'li-post_v1.png', file_path: `social/${COMPANY_ALPHA}/ccccccc1-cccc-4ccc-8ccc-ccccccccccc1/linkedin/li-post_v1.png`, preview_url: 'https://cdn.facebrasil.com/social/li-post_v1.png', device_mockup: 'LinkedIn feed mockup', created_at: '2026-05-08T10:08:00.000Z' },
  { id: 'ddddddd5-dddd-4ddd-8ddd-ddddddddddd5', job_id: 'ccccccc2-cccc-4ccc-8ccc-ccccccccccc2', company_id: COMPANY_ALPHA, network: 'linkedin', format_slug: 'li-post', template_id: 'bbbbbbb4-bbbb-4bbb-8bbb-bbbbbbbbbbb4', version: 1, status: 'rendered', ext: 'png', width: 1200, height: 627, size_bytes: 1_380_000, file_name: 'li-post_v1.png', file_path: `social/${COMPANY_ALPHA}/ccccccc2-cccc-4ccc-8ccc-ccccccccccc2/linkedin/li-post_v1.png`, preview_url: 'https://cdn.facebrasil.com/social/li-post_news_v1.png', device_mockup: 'LinkedIn editorial', created_at: '2026-05-08T10:02:00.000Z' },
  { id: 'ddddddd6-dddd-4ddd-8ddd-ddddddddddd6', job_id: 'ccccccc2-cccc-4ccc-8ccc-ccccccccccc2', company_id: COMPANY_ALPHA, network: 'twitter_x', format_slug: 'tw-post', template_id: 'bbbbbbb4-bbbb-4bbb-8bbb-bbbbbbbbbbb4', version: 1, status: 'rendered', ext: 'jpg', width: 1600, height: 900, size_bytes: 1_020_000, file_name: 'tw-post_v1.jpg', file_path: `social/${COMPANY_ALPHA}/ccccccc2-cccc-4ccc-8ccc-ccccccccccc2/twitter_x/tw-post_v1.jpg`, preview_url: 'https://cdn.facebrasil.com/social/tw-post_v1.jpg', device_mockup: 'X card', created_at: '2026-05-08T10:03:00.000Z' },
  { id: 'ddddddd7-dddd-4ddd-8ddd-ddddddddddd7', job_id: 'ccccccc2-cccc-4ccc-8ccc-ccccccccccc2', company_id: COMPANY_ALPHA, network: 'youtube', format_slug: 'yt-community', template_id: 'bbbbbbb5-bbbb-4bbb-8bbb-bbbbbbbbbbb5', version: 1, status: 'quality_warning', ext: 'png', width: 1200, height: 675, size_bytes: 3_980_000, file_name: 'yt-community_v1.png', file_path: `social/${COMPANY_ALPHA}/ccccccc2-cccc-4ccc-8ccc-ccccccccccc2/youtube/yt-community_v1.png`, preview_url: 'https://cdn.facebrasil.com/social/yt-community_v1.png', device_mockup: 'Community mockup', created_at: '2026-05-08T10:04:00.000Z' },
  { id: 'ddddddd8-dddd-4ddd-8ddd-ddddddddddd8', job_id: 'ccccccc3-cccc-4ccc-8ccc-ccccccccccc3', company_id: COMPANY_ALPHA, network: 'youtube', format_slug: 'yt-thumb', template_id: 'bbbbbbb5-bbbb-4bbb-8bbb-bbbbbbbbbbb5', version: 1, status: 'ready', ext: 'png', width: 1280, height: 720, size_bytes: 1_845_000, file_name: 'yt-thumb_v1.png', file_path: `social/${COMPANY_ALPHA}/ccccccc3-cccc-4ccc-8ccc-ccccccccccc3/youtube/yt-thumb_v1.png`, preview_url: 'https://cdn.facebrasil.com/social/yt-thumb_v1.png', device_mockup: 'YouTube thumb', created_at: '2026-05-08T07:20:00.000Z' },
  { id: 'ddddddd9-dddd-4ddd-8ddd-ddddddddddd9', job_id: 'ccccccc3-cccc-4ccc-8ccc-ccccccccccc3', company_id: COMPANY_ALPHA, network: 'pinterest', format_slug: 'pin-vertical', template_id: 'bbbbbbb5-bbbb-4bbb-8bbb-bbbbbbbbbbb5', version: 1, status: 'ready', ext: 'png', width: 1000, height: 1500, size_bytes: 2_010_000, file_name: 'pin-vertical_v1.png', file_path: `social/${COMPANY_ALPHA}/ccccccc3-cccc-4ccc-8ccc-ccccccccccc3/pinterest/pin-vertical_v1.png`, preview_url: 'https://cdn.facebrasil.com/social/pin-vertical_v1.png', device_mockup: 'Pinterest pin', created_at: '2026-05-08T07:22:00.000Z' },
  { id: 'ddddddd0-dddd-4ddd-8ddd-ddddddddddd0', job_id: 'ccccccc3-cccc-4ccc-8ccc-ccccccccccc3', company_id: COMPANY_ALPHA, network: 'pinterest', format_slug: 'pin-story', template_id: 'bbbbbbb5-bbbb-4bbb-8bbb-bbbbbbbbbbb5', version: 1, status: 'ready', ext: 'png', width: 1080, height: 1920, size_bytes: 2_500_000, file_name: 'pin-story_v1.png', file_path: `social/${COMPANY_ALPHA}/ccccccc3-cccc-4ccc-8ccc-ccccccccccc3/pinterest/pin-story_v1.png`, preview_url: 'https://cdn.facebrasil.com/social/pin-story_v1.png', device_mockup: 'Story pin', created_at: '2026-05-08T07:24:00.000Z' },
];

const initialQualityChecksSeed: QualityCheck[] = [
  { id: 'eeeeeee1-eeee-4eee-8eee-eeeeeeeeeee1', arte_id: 'ddddddd1-dddd-4ddd-8ddd-ddddddddddd1', dimensions_ok: true, safe_zone_ok: true, file_size_ok: true, contrast_ok: true, logo_ok: true, contrast_ratio: 6.1, outcome: 'approved', notes: [], checked_at: '2026-05-08T10:11:00.000Z' },
  { id: 'eeeeeee2-eeee-4eee-8eee-eeeeeeeeeee2', arte_id: 'ddddddd2-dddd-4ddd-8ddd-ddddddddddd2', dimensions_ok: true, safe_zone_ok: false, file_size_ok: true, contrast_ok: true, logo_ok: true, contrast_ratio: 5.4, outcome: 'warning', notes: ['CTA entrou 24px abaixo da safe zone inferior.'], checked_at: '2026-05-08T10:12:00.000Z' },
  { id: 'eeeeeee3-eeee-4eee-8eee-eeeeeeeeeee3', arte_id: 'ddddddd3-dddd-4ddd-8ddd-ddddddddddd3', dimensions_ok: true, safe_zone_ok: true, file_size_ok: true, contrast_ok: true, logo_ok: true, contrast_ratio: 4.9, outcome: 'approved', notes: [], checked_at: '2026-05-08T10:12:00.000Z' },
  { id: 'eeeeeee4-eeee-4eee-8eee-eeeeeeeeeee4', arte_id: 'ddddddd4-dddd-4ddd-8ddd-ddddddddddd4', dimensions_ok: true, safe_zone_ok: true, file_size_ok: true, contrast_ok: true, logo_ok: true, contrast_ratio: 6.4, outcome: 'approved', notes: [], checked_at: '2026-05-08T10:13:00.000Z' },
  { id: 'eeeeeee5-eeee-4eee-8eee-eeeeeeeeeee5', arte_id: 'ddddddd7-dddd-4ddd-8ddd-ddddddddddd7', dimensions_ok: true, safe_zone_ok: true, file_size_ok: true, contrast_ok: false, logo_ok: true, contrast_ratio: 4.1, outcome: 'warning', notes: ['Contraste abaixo do WCAG AA para texto normal.'], checked_at: '2026-05-08T10:14:00.000Z' },
  { id: 'eeeeeee6-eeee-4eee-8eee-eeeeeeeeeee6', arte_id: 'ddddddd8-dddd-4ddd-8ddd-ddddddddddd8', dimensions_ok: true, safe_zone_ok: true, file_size_ok: true, contrast_ok: true, logo_ok: true, contrast_ratio: 7.2, outcome: 'approved', notes: [], checked_at: '2026-05-08T07:35:00.000Z' },
  { id: 'eeeeeee7-eeee-4eee-8eee-eeeeeeeeeee7', arte_id: 'ddddddd9-dddd-4ddd-8ddd-ddddddddddd9', dimensions_ok: true, safe_zone_ok: true, file_size_ok: true, contrast_ok: true, logo_ok: true, contrast_ratio: 5.6, outcome: 'approved', notes: [], checked_at: '2026-05-08T07:36:00.000Z' },
  { id: 'eeeeeee8-eeee-4eee-8eee-eeeeeeeeeee8', arte_id: 'ddddddd0-dddd-4ddd-8ddd-ddddddddddd0', dimensions_ok: true, safe_zone_ok: true, file_size_ok: true, contrast_ok: true, logo_ok: true, contrast_ratio: 5.8, outcome: 'approved', notes: [], checked_at: '2026-05-08T07:36:00.000Z' },
].map((item) => QualityCheckSchema.parse(item));

const initialAgentSlotsSeed: SocialAgentSlot[] = [
  { id: 'compositor', name: 'Compositor', role: 'HTML/CSS + render orchestration', cadence: 'sob demanda por job', status: 'gerando', summary: 'Monta HTML final e escolhe render engine primaria/fallback.' },
  { id: 'assetfinder', name: 'AssetFinder', role: 'Curadoria de imagem licenciada', cadence: 'consulta por briefing', status: 'online', summary: 'Busca assets seguros em fontes externas e reduz retrabalho visual.' },
  { id: 'brandsync', name: 'BrandSync', role: 'Cache de brand kits FBR-Design', cadence: 'cron 24h + webhook', status: 'online', summary: 'Mantem logos, paletas e fontes sincronizados sem acesso cross-db.' },
];

const initialAgentEventsSeed: SocialAgentEvent[] = [
  { id: 'fffffff1-ffff-4fff-8fff-fffffffffff1', event: 'job_started', message: 'Job Imovel Top entrou em revisao com 4 variantes renderizadas.', job_id: 'ccccccc1-cccc-4ccc-8ccc-ccccccccccc1', progress: 92, occurred_at: '2026-05-08T10:10:00.000Z' },
  { id: 'fffffff2-ffff-4fff-8fff-fffffffffff2', event: 'quality_warning', message: 'Safe zone do IG Stories marcou warning no CTA inferior.', job_id: 'ccccccc1-cccc-4ccc-8ccc-ccccccccccc1', progress: 95, occurred_at: '2026-05-08T10:12:00.000Z' },
  { id: 'fffffff3-ffff-4fff-8fff-fffffffffff3', event: 'arte_generated', message: 'Variant yt-thumb_v1.png entregue para Portal Premium.', job_id: 'ccccccc3-cccc-4ccc-8ccc-ccccccccccc3', progress: 100, occurred_at: '2026-05-08T07:24:00.000Z' },
];

export const arvaSocialAgents: ArvaAgent[] = [
  { id: 'arva-compositor', name: 'Compositor', role: 'Render HTML/CSS', tags: ['social media', 'design'], status: 'active' },
  { id: 'arva-assetfinder', name: 'AssetFinder', role: 'Assets licenciados', tags: ['social media', 'conteudo visual'], status: 'active' },
  { id: 'arva-brandsync', name: 'BrandSync', role: 'Brand kit proxy', tags: ['design', 'conteudo visual'], status: 'active' },
  { id: 'arva-thumbsmith', name: 'Thumbsmith', role: 'Capas de video', tags: ['conteudo visual'], status: 'inactive' },
  { id: 'arva-support', name: 'Suporte IA', role: 'Atendimento tecnico', tags: ['suporte'], status: 'active' },
];

let formatCatalog = clone(formatCatalogSeed);
let sourceBrandKits = clone(sourceBrandKitsSeed);
let brandKitCache = clone(sourceBrandKitsSeed);
let templates = clone(initialTemplatesSeed);
let jobs = clone(initialJobsSeed);
let artefacts = clone(initialArtesSeed);
let qualityChecks = clone(initialQualityChecksSeed);
let agentSlots = clone(initialAgentSlotsSeed);
let agentEvents = clone(initialAgentEventsSeed);

function parseJsonObject(input: unknown) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new SocialValidationError('JSON object payload is required.', 400);
  }
  return input;
}

function normalizeZodError(error: z.ZodError) {
  const hasMissingRequired = error.issues.some((issue) => issue.code === 'invalid_type' && issue.received === 'undefined');
  return new SocialValidationError(hasMissingRequired ? 'Required fields are missing.' : 'Payload validation failed.', hasMissingRequired ? 400 : 422, error.issues);
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function ensureAdmin(context: SocialRequestContext) {
  if (context.role !== 'admin') throw new SocialValidationError('Admin role is required for this action.', 403);
}

function getFormatSpec(slug: string) {
  const format = formatCatalog.find((item) => item.slug === slug);
  if (!format) throw new SocialValidationError(`Unknown format slug: ${slug}.`, 422);
  return format;
}

function refreshCacheIfNeeded(entry: BrandKitCacheEntry): BrandKitCacheEntry {
  if (!entry.stale) return entry;
  const source = sourceBrandKits.find((item) => item.id === entry.id);
  if (!source) return entry;
  entry.palette = source.palette;
  entry.fonts = source.fonts;
  entry.logos = source.logos;
  entry.guidelines = source.guidelines;
  entry.restrictions = source.restrictions;
  entry.source_updated_at = source.source_updated_at;
  entry.cached_at = nowIso();
  entry.stale = false;
  entry.stale_reason = undefined;
  return entry;
}

function buildPipeline(status: SocialJobStatus): PipelineStepSnapshot[] {
  const flow = [
    ['briefing', 'Recebimento', 'Valida campos e redes alvo.'],
    ['brand_kit', 'Brand Kit', 'Busca brand kit via proxy com cache local.'],
    ['templates', 'Templates', 'Seleciona template mais recente por rede.'],
    ['assets', 'Assets', 'Resolve logos, imagens e placeholders.'],
    ['composicao', 'Composicao HTML/CSS', 'Gera layout final com estilos inline.'],
    ['render', 'Render', 'HTMLCSStoImage primario e fallback local.'],
    ['quality_check', 'Quality Check', 'Valida dimensoes, safe zone, contraste e tamanho.'],
    ['storage', 'Storage + ZIP', 'Salva artefatos, manifesta e pacote final.'],
  ] as const;

  const order: SocialJobStatus[] = ['fila', 'brand_kit', 'templates', 'assets', 'composicao', 'render', 'quality_check', 'storage', 'revisao', 'pronta'];
  const activeIndex = order.indexOf(status);

  return flow.map(([id, label, description], index) => {
    let stepStatus: PipelineStepSnapshot['status'] = 'pending';
    if (activeIndex > index + 1 || status === 'pronta') stepStatus = 'completed';
    if (activeIndex === index + 1) stepStatus = status === 'erro' ? 'failed' : 'active';
    if (status === 'revisao' && id === 'quality_check') stepStatus = 'warning';
    if (status === 'erro' && index >= activeIndex) stepStatus = 'failed';
    return { id, label, description, status: stepStatus };
  });
}

function arteMatchesQuery(arte: SocialArte, query: SocialGalleryQuery) {
  if (query.network && !query.network.includes(arte.network)) return false;
  if (query.status && !query.status.includes(arte.status)) return false;
  return true;
}

function buildPackageManifest(job: SocialJob, selectedArtefacts: SocialArte[]): PackageManifest {
  const files = selectedArtefacts
    .filter((arte) => arte.status === 'ready' || arte.status === 'quality_warning')
    .map((arte) => ({
      network: arte.network,
      format_slug: arte.format_slug,
      file: `${arte.network}/${arte.file_name}`,
      dimensions: `${arte.width}x${arte.height}`,
      size_bytes: arte.size_bytes,
    }));

  return {
    job_id: job.id,
    product_name: job.product_name,
    generated_at: nowIso(),
    networks: Array.from(new Set(files.map((file) => file.network))),
    files,
    total_files: files.length,
    total_size_bytes: files.reduce((total, file) => total + file.size_bytes, 0),
  };
}

export function resetSocialStoreForTests() {
  formatCatalog = clone(formatCatalogSeed);
  sourceBrandKits = clone(sourceBrandKitsSeed);
  brandKitCache = clone(sourceBrandKitsSeed);
  templates = clone(initialTemplatesSeed);
  jobs = clone(initialJobsSeed);
  artefacts = clone(initialArtesSeed);
  qualityChecks = clone(initialQualityChecksSeed);
  agentSlots = clone(initialAgentSlotsSeed);
  agentEvents = clone(initialAgentEventsSeed);
}

resetSocialStoreForTests();

export function getSocialTestCompanyIds() {
  return { alpha: COMPANY_ALPHA, user: USER_SYSTEM };
}

export function getSocialWebhookSecretForTests() {
  return WEBHOOK_SECRET;
}

export function buildSocialWebhookSignature(payload: string, secret = WEBHOOK_SECRET) {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

export function parseSocialJobsQuery(url: string): SocialJobsQuery {
  const params = new URL(url).searchParams;
  const rawNetwork = params.getAll('network').flatMap((item) => item.split(',')).filter(Boolean);
  const rawStatus = params.getAll('status').flatMap((item) => item.split(',')).filter(Boolean);

  try {
    return SocialJobsQuerySchema.parse({
      search: params.get('search') ?? undefined,
      network: rawNetwork.length > 0 ? rawNetwork : undefined,
      status: rawStatus.length > 0 ? rawStatus : undefined,
      page: params.get('page') ?? undefined,
      page_size: params.get('page_size') ?? undefined,
    });
  } catch (error) {
    if (error instanceof z.ZodError) throw normalizeZodError(error);
    throw error;
  }
}

export function parseSocialTemplatesQuery(url: string): SocialTemplatesQuery {
  const params = new URL(url).searchParams;
  const rawNetwork = params.getAll('network').flatMap((item) => item.split(',')).filter(Boolean);

  try {
    return SocialTemplatesQuerySchema.parse({
      network: rawNetwork.length > 0 ? rawNetwork : undefined,
      include_inactive: params.get('include_inactive') ?? undefined,
    });
  } catch (error) {
    if (error instanceof z.ZodError) throw normalizeZodError(error);
    throw error;
  }
}

export function parseSocialGalleryQuery(url: string): SocialGalleryQuery {
  const params = new URL(url).searchParams;
  const rawNetwork = params.getAll('network').flatMap((item) => item.split(',')).filter(Boolean);
  const rawStatus = params.getAll('status').flatMap((item) => item.split(',')).filter(Boolean);

  try {
    return SocialGalleryQuerySchema.parse({
      network: rawNetwork.length > 0 ? rawNetwork : undefined,
      status: rawStatus.length > 0 ? rawStatus : undefined,
    });
  } catch (error) {
    if (error instanceof z.ZodError) throw normalizeZodError(error);
    throw error;
  }
}

export function listFormatCatalog() {
  return clone(formatCatalog);
}

export function listNetworkMatrix(): NetworkFormatGroup[] {
  const labels: Record<SocialNetwork, string> = {
    instagram: 'Instagram',
    facebook: 'Facebook',
    linkedin: 'LinkedIn',
    tiktok: 'TikTok',
    twitter_x: 'Twitter/X',
    youtube: 'YouTube',
    pinterest: 'Pinterest',
    whatsapp: 'WhatsApp',
  };

  return (Object.keys(labels) as SocialNetwork[]).map((network) => {
    const formats = formatCatalog.filter((item) => item.network === network);
    return {
      network,
      label: labels[network],
      format_count: formats.length,
      formats,
    };
  });
}

export function listBrandKits(context: SocialRequestContext) {
  return brandKitCache
    .filter((item) => item.company_id === context.companyId)
    .map((entry) => refreshCacheIfNeeded(entry))
    .map((entry) => clone(entry));
}

export function listTemplates(context: SocialRequestContext, query: Partial<SocialTemplatesQuery> = {}) {
  const parsed = SocialTemplatesQuerySchema.parse(query);
  return templates.filter((template) => {
    if (template.company_id !== context.companyId) return false;
    if (!parsed.include_inactive && !template.active) return false;
    if (parsed.network && !parsed.network.includes(template.network)) return false;
    return true;
  });
}

export function listTemplateVersions(context: SocialRequestContext, id: string) {
  const template = templates.find((item) => item.id === id && item.company_id === context.companyId);
  if (!template) throw new SocialValidationError('Template not found.', 404);
  return templates
    .filter((item) => item.company_id === context.companyId && item.network === template.network && item.format_slug === template.format_slug && item.content_type === template.content_type)
    .sort((left, right) => right.version - left.version);
}

export function createTemplate(context: SocialRequestContext, data: unknown) {
  ensureAdmin(context);
  const input = parseJsonObject(data);
  const schema = z.object({
    brand_kit_id: z.string().uuid(),
    name: z.string().min(1),
    network: z.string(),
    format_slug: z.string().min(1),
    content_type: z.string().min(1),
    config: z.object({
      layers: z.array(z.unknown()).min(1),
    }).passthrough(),
  });

  try {
    const validated = schema.parse(input);
    const format = getFormatSpec(validated.format_slug);
    const nextVersion = Math.max(
      0,
      ...templates
        .filter((item) => item.company_id === context.companyId && item.network === validated.network && item.format_slug === validated.format_slug && item.content_type === validated.content_type)
        .map((item) => item.version),
    ) + 1;

    const template: SocialTemplate = {
      id: crypto.randomUUID(),
      company_id: context.companyId,
      brand_kit_id: validated.brand_kit_id,
      name: validated.name,
      network: format.network,
      format_slug: validated.format_slug,
      content_type: validated.content_type,
      version: nextVersion,
      active: true,
      config: {
        template_id: `${validated.format_slug}-v${nextVersion}`,
        version: nextVersion,
        network: format.network,
        format_slug: validated.format_slug,
        dimensions: { width: format.width, height: format.height },
        layers: validated.config.layers as TemplateConfig['layers'],
        global_styles: {
          font_heading: '{{font_heading}}',
          font_body: '{{font_body}}',
          primary_color: '{{primary_color}}',
          text_color: '{{text_color}}',
          accent_color: '{{accent_color}}',
        },
      },
      created_at: nowIso(),
      updated_at: nowIso(),
    };

    templates
      .filter((item) => item.company_id === context.companyId && item.network === template.network && item.format_slug === template.format_slug && item.content_type === template.content_type && item.active)
      .forEach((item) => { item.active = false; });

    templates.push(template);
    return template;
  } catch (error) {
    if (error instanceof z.ZodError) throw normalizeZodError(error);
    throw error;
  }
}

export function updateTemplate(context: SocialRequestContext, id: string, data: unknown) {
  ensureAdmin(context);
  const existing = templates.find((item) => item.id === id && item.company_id === context.companyId);
  if (!existing) throw new SocialValidationError('Template not found.', 404);
  const input = parseJsonObject(data);
  const schema = z.object({
    name: z.string().min(1).optional(),
    config: z.object({
      layers: z.array(z.unknown()).min(1),
    }).passthrough(),
  });

  try {
    const validated = schema.parse(input);
    existing.active = false;
    const nextVersion = Math.max(...listTemplateVersions(context, id).map((item) => item.version)) + 1;
    const cloned: SocialTemplate = {
      ...clone(existing),
      id: crypto.randomUUID(),
      name: validated.name ?? existing.name,
      version: nextVersion,
      active: true,
      config: {
        ...existing.config,
        version: nextVersion,
        layers: (validated.config?.layers as TemplateConfig['layers']) ?? existing.config.layers,
      },
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    templates.push(cloned);
    return cloned;
  } catch (error) {
    if (error instanceof z.ZodError) throw normalizeZodError(error);
    throw error;
  }
}

export function softDeleteTemplate(context: SocialRequestContext, id: string) {
  ensureAdmin(context);
  const template = templates.find((item) => item.id === id && item.company_id === context.companyId);
  if (!template) throw new SocialValidationError('Template not found.', 404);
  template.active = false;
  template.deleted_at = nowIso();
  return template;
}

export function listJobs(context: SocialRequestContext, query: Partial<SocialJobsQuery> = {}) {
  const parsed = SocialJobsQuerySchema.parse(query);
  const filtered = jobs.filter((job) => {
    if (job.company_id !== context.companyId) return false;
    if (parsed.search) {
      const haystack = `${job.product_name} ${job.headline} ${job.content_type}`.toLowerCase();
      if (!haystack.includes(parsed.search.toLowerCase())) return false;
    }
    if (parsed.network && !job.target_networks.some((item) => parsed.network?.includes(item))) return false;
    if (parsed.status && !parsed.status.includes(job.status)) return false;
    return true;
  });

  const start = (parsed.page - 1) * parsed.page_size;
  const items = filtered.slice(start, start + parsed.page_size);

  return {
    items,
    pagination: {
      page: parsed.page,
      page_size: parsed.page_size,
      total: filtered.length,
      total_pages: Math.ceil(filtered.length / parsed.page_size),
    },
  };
}

export function getJob(context: SocialRequestContext, id: string) {
  const job = jobs.find((item) => item.id === id && item.company_id === context.companyId);
  if (!job) throw new SocialValidationError('Job not found.', 404);
  return clone(job);
}

export function createJob(context: SocialRequestContext, data: unknown) {
  const input = parseJsonObject(data);
  const schema = z.object({
    product_name: z.string().min(1),
    brand_kit_id: z.string().uuid(),
    content_type: z.string().min(1),
    tone: z.string().min(1),
    headline: z.string().min(1).max(100),
    subheadline: z.string().min(1),
    cta_text: z.string().min(1),
    target_networks: z.array(z.string()).min(1),
    format_slugs: z.array(z.string()).min(1),
  });

  try {
    const validated = schema.parse(input);
    validated.format_slugs.forEach((slug) => getFormatSpec(slug));
    const job: SocialJob = {
      id: crypto.randomUUID(),
      company_id: context.companyId,
      product_name: validated.product_name,
      brand_kit_id: validated.brand_kit_id,
      content_type: validated.content_type,
      tone: validated.tone,
      headline: validated.headline,
      subheadline: validated.subheadline,
      cta_text: validated.cta_text,
      target_networks: validated.target_networks as SocialNetwork[],
      format_slugs: validated.format_slugs,
      status: 'fila',
      queue_position: jobs.filter((jobItem) => jobItem.company_id === context.companyId && jobItem.status !== 'pronta').length + 1,
      eta_minutes: validated.format_slugs.length * 4,
      origin_module: context.moduleSource,
      created_by: context.userId,
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    jobs.unshift(job);
    return job;
  } catch (error) {
    if (error instanceof z.ZodError) throw normalizeZodError(error);
    throw error;
  }
}

export function updateJobStatus(context: SocialRequestContext, id: string, status: SocialJobStatus) {
  const job = jobs.find((item) => item.id === id && item.company_id === context.companyId);
  if (!job) throw new SocialValidationError('Job not found.', 404);
  job.status = status;
  job.updated_at = nowIso();
  if (status === 'pronta') {
    job.queue_position = 0;
    job.eta_minutes = 0;
  }
  agentEvents.unshift({
    id: crypto.randomUUID(),
    event: status === 'pronta' ? 'job_completed' : 'job_started',
    message: `Job ${job.product_name} mudou para ${status}.`,
    job_id: job.id,
    progress: status === 'pronta' ? 100 : undefined,
    occurred_at: nowIso(),
  });
  return clone(job);
}

export function listGallery(context: SocialRequestContext, query: Partial<SocialGalleryQuery> = {}) {
  const parsed = SocialGalleryQuerySchema.parse(query);
  return artefacts.filter((arte) => arte.company_id === context.companyId && arteMatchesQuery(arte, parsed));
}

export function listQualityChecks(context: SocialRequestContext) {
  const arteIds = new Set(artefacts.filter((item) => item.company_id === context.companyId).map((item) => item.id));
  return qualityChecks.filter((item) => arteIds.has(item.arte_id));
}

export function generateZipPackage(context: SocialRequestContext, jobId: string, arteIds?: string[]) {
  const job = getJob(context, jobId);
  const selectedArtefacts = artefacts.filter((item) => item.job_id === job.id && item.company_id === context.companyId && (!arteIds || arteIds.includes(item.id)));
  const manifest = buildPackageManifest(job, selectedArtefacts);
  return {
    zip_name: `${slugify(job.product_name)}_2026-05-08_${job.target_networks[0]}_social.zip`,
    manifest,
  };
}

function buildPackagePreview(context: SocialRequestContext, jobId: string): SocialPackagePreview {
  return generateZipPackage(context, jobId);
}

export function getSocialKpis(context: SocialRequestContext): SocialKpi {
  const companyJobs = jobs.filter((item) => item.company_id === context.companyId);
  const companyArtefacts = artefacts.filter((item) => item.company_id === context.companyId);
  const approved = qualityChecks.filter((item) => {
    const arte = artefacts.find((entry) => entry.id === item.arte_id);
    return arte?.company_id === context.companyId && item.outcome === 'approved';
  }).length;

  return {
    jobs_hoje: companyJobs.filter((job) => job.created_at.startsWith('2026-05-08')).length,
    artes_geradas: companyArtefacts.length,
    aprovadas: approved,
    pendentes: companyJobs.filter((job) => !['pronta', 'erro'].includes(job.status)).length,
    redes_ativas: new Set(companyJobs.flatMap((job) => job.target_networks)).size,
    formatos_suportados: formatCatalog.length,
  };
}

export function getAgentPanel() {
  return {
    slots: clone(agentSlots),
    events: clone(agentEvents),
  };
}

export function getDashboardSnapshot(context: SocialRequestContext): SocialDashboardSnapshot {
  const jobsForCompany = listJobs(context, { page_size: 50 }).items;
  const artefactsForCompany = listGallery(context);
  const checksForCompany = listQualityChecks(context);
  const brandKitsForCompany = listBrandKits(context);
  const templatesForCompany = listTemplates(context, { include_inactive: true });
  const panel = getAgentPanel();
  const readyJob = jobsForCompany.find((job) => job.status === 'pronta') ?? jobsForCompany.find((job) => job.status === 'revisao') ?? null;

  return {
    kpis: getSocialKpis(context),
    network_matrix: listNetworkMatrix(),
    pipeline: readyJob ? buildPipeline(readyJob.status) : buildPipeline('fila'),
    jobs: jobsForCompany,
    artefacts: artefactsForCompany,
    quality_checks: checksForCompany,
    templates: templatesForCompany,
    brand_kits: brandKitsForCompany,
    agent_slots: panel.slots,
    agent_events: panel.events,
    package_preview: readyJob ? buildPackagePreview(context, readyJob.id) : null,
  };
}

export function getBrandKitCacheSnapshotForTests() {
  return clone(brandKitCache);
}

export function invalidateBrandKitCache(payload: BrandKitWebhookPayload) {
  const parsed = BrandKitWebhookPayloadSchema.parse(payload);
  const brandKitId = parsed.data.brand_kit_id ?? parsed.brand_kit_id;
  if (!brandKitId) throw new SocialValidationError('Webhook payload must contain brand_kit_id.', 400);
  const entry = brandKitCache.find((item) => item.id === brandKitId);
  if (!entry) return { invalidated: false, brand_kit_id: brandKitId };
  entry.stale = true;
  entry.stale_reason = 'webhook_invalidation';
  entry.cached_at = parsed.data.updated_at ?? parsed.updated_at ?? nowIso();
  agentEvents.unshift({
    id: crypto.randomUUID(),
    event: 'cache_invalidated',
    message: `Brand kit ${entry.product_name} invalidado por webhook.`,
    occurred_at: nowIso(),
  });
  return { invalidated: true, brand_kit_id: brandKitId };
}

export function parseAndValidateBrandKitWebhook(body: string, signature: string | null, secret = WEBHOOK_SECRET) {
  if (!signature) throw new SocialValidationError('Missing webhook signature.', 401);
  const expected = buildSocialWebhookSignature(body, secret);
  if (signature !== expected) throw new SocialValidationError('Invalid webhook signature.', 401);
  try {
    return BrandKitWebhookPayloadSchema.parse(JSON.parse(body));
  } catch (error) {
    if (error instanceof SyntaxError) throw new SocialValidationError('Malformed JSON payload.', 400);
    if (error instanceof z.ZodError) throw normalizeZodError(error);
    throw error;
  }
}
