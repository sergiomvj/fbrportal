import { createHmac } from 'node:crypto';
import { z } from 'zod';
import type { ArvaAgent } from '@fbr/arva-integration';
import {
  BrandKit,
  BrandKitSchema,
  DesignActivityLog,
  DesignAgentSlot,
  DesignDashboardKpis,
  DesignExportRequest,
  DesignExportRequestSchema,
  DesignFormat,
  DesignJob,
  DesignJobsQuery,
  DesignJobsQuerySchema,
  DesignJobSchema,
  DesignModuleSnapshot,
  DesignReviewPack,
  DesignSalesApproval,
  DesignTemplate,
  DesignVariant,
  DesignWebhookPreview,
  Deliverable,
  ReviewRuleResult,
} from './types';

export interface DesignRequestContext {
  companyId: string;
  userId: string;
  moduleSource: string;
}

export class DesignValidationError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 401 | 403 | 404 | 409 | 422,
    readonly issues?: unknown,
  ) {
    super(message);
  }
}

const COMPANY_ALPHA = '11111111-1111-4111-8111-111111111111';
const CLIENT_AURORA = '22222222-2222-4222-8222-222222222221';
const CLIENT_NEXUS = '22222222-2222-4222-8222-222222222222';
const CLIENT_VIVA = '22222222-2222-4222-8222-222222222223';
const USER_OPERATOR = '33333333-3333-4333-8333-333333333333';
const WEBHOOK_SECRET = 'design-social-secret';

const formatCatalog: DesignFormat[] = [
  { slug: 'ig-feed-square', name: 'Instagram Feed Quadrado', category: 'social_media', width: 1080, height: 1080, aspect_ratio: '1:1', safe_zone_width: 1000, safe_zone_height: 1000, usage: 'Post de feed' },
  { slug: 'ig-feed-portrait', name: 'Instagram Feed Retrato', category: 'social_media', width: 1080, height: 1350, aspect_ratio: '4:5', safe_zone_width: 1000, safe_zone_height: 1250, usage: 'Post retrato' },
  { slug: 'ig-stories', name: 'Instagram Stories / Reels', category: 'social_media', width: 1080, height: 1920, aspect_ratio: '9:16', safe_zone_width: 1000, safe_zone_height: 1700, usage: 'Stories e Reels' },
  { slug: 'fb-post', name: 'Facebook Post', category: 'social_media', width: 1200, height: 630, aspect_ratio: '1.91:1', safe_zone_width: 1080, safe_zone_height: 530, usage: 'Feed Facebook' },
  { slug: 'li-post', name: 'LinkedIn Post', category: 'social_media', width: 1200, height: 627, aspect_ratio: '1.91:1', safe_zone_width: 1080, safe_zone_height: 527, usage: 'Feed LinkedIn' },
  { slug: 'li-banner', name: 'LinkedIn Banner', category: 'social_media', width: 1584, height: 396, aspect_ratio: '4:1', safe_zone_width: 1400, safe_zone_height: 300, usage: 'Capa de perfil' },
  { slug: 'tt-vertical', name: 'TikTok Vertical', category: 'social_media', width: 1080, height: 1920, aspect_ratio: '9:16', safe_zone_width: 960, safe_zone_height: 1700, usage: 'Video/thumbnail' },
  { slug: 'yt-thumb', name: 'YouTube Thumbnail', category: 'social_media', width: 1280, height: 720, aspect_ratio: '16:9', safe_zone_width: 1140, safe_zone_height: 620, usage: 'Thumbnail de video' },
  { slug: 'ads-300x250', name: 'Medium Rectangle', category: 'digital_ads', width: 300, height: 250, aspect_ratio: '1.2:1', usage: 'Google Ads padrao' },
  { slug: 'ads-728x90', name: 'Leaderboard', category: 'digital_ads', width: 728, height: 90, aspect_ratio: '8.09:1', usage: 'Topo de pagina' },
  { slug: 'ads-970x250', name: 'Billboard', category: 'digital_ads', width: 970, height: 250, aspect_ratio: '3.88:1', usage: 'Topo premium' },
  { slug: 'hero-desktop', name: 'Site Hero Desktop', category: 'digital_ads', width: 1920, height: 600, aspect_ratio: '3.2:1', usage: 'Hero banner desktop' },
  { slug: 'hero-mobile', name: 'Site Hero Mobile', category: 'digital_ads', width: 750, height: 1334, aspect_ratio: '1:1.78', usage: 'Hero mobile' },
  { slug: 'blog-cover', name: 'Blog Cover', category: 'digital_ads', width: 1200, height: 628, aspect_ratio: '1.91:1', usage: 'Capa de artigo' },
  { slug: 'newsletter-header', name: 'Newsletter Header', category: 'digital_ads', width: 600, height: 200, aspect_ratio: '3:1', usage: 'Cabecalho de email' },
  { slug: 'card-visit', name: 'Cartao de Visita', category: 'identidade_visual', width: 1039, height: 649, aspect_ratio: '1.6:1', usage: 'Cartao de visita impresso' },
  { slug: 'card-visit-back', name: 'Cartao de Visita Verso', category: 'identidade_visual', width: 1039, height: 649, aspect_ratio: '1.6:1', usage: 'Verso do cartao' },
  { slug: 'sig-email', name: 'Assinatura de Email', category: 'identidade_visual', width: 600, height: 200, aspect_ratio: '3:1', usage: 'Assinatura HTML' },
  { slug: 'avatar', name: 'Avatar Agente/Produto', category: 'identidade_visual', width: 512, height: 512, aspect_ratio: '1:1', usage: 'Avatar generico' },
  { slug: 'favicon', name: 'Favicon', category: 'identidade_visual', width: 512, height: 512, aspect_ratio: '1:1', usage: 'Pacote favicon' },
  { slug: 'badge', name: 'Selo de Qualidade', category: 'identidade_visual', width: 300, height: 300, aspect_ratio: '1:1', usage: 'Badge e selo' },
  { slug: 'pptx-widescreen', name: 'Apresentacao PPTX', category: 'documentos', width: 1280, height: 720, aspect_ratio: '16:9', usage: 'Apresentacao widescreen' },
  { slug: 'pptx-standard', name: 'Apresentacao PPTX 4:3', category: 'documentos', width: 1024, height: 768, aspect_ratio: '4:3', usage: 'Apresentacao legada' },
  { slug: 'pdf-a4', name: 'PDF Executivo A4', category: 'documentos', width: 2480, height: 3508, aspect_ratio: '0.707:1', usage: 'Relatorio A4' },
  { slug: 'pdf-a4-landscape', name: 'PDF Executivo A4 Paisagem', category: 'documentos', width: 3508, height: 2480, aspect_ratio: '1.414:1', usage: 'Relatorio paisagem' },
  { slug: 'media-kit', name: 'Media Kit', category: 'documentos', width: 2480, height: 3508, aspect_ratio: '0.707:1', usage: 'Documento para FBR-Sales' },
  { slug: 'pitch-deck', name: 'Pitch Deck', category: 'documentos', width: 1280, height: 720, aspect_ratio: '16:9', usage: 'Deck comercial' },
];

const initialBrandKits: BrandKit[] = [
  {
    id: 'dddddddd-dddd-4ddd-8ddd-dddddddddd01',
    company_id: COMPANY_ALPHA,
    client_id: CLIENT_AURORA,
    nome: 'Aurora Premium',
    empresa: 'Aurora Clinic',
    segmento: 'saude premium',
    versao: 4,
    ativo: true,
    cores: {
      primary: '#1E3A5F',
      secondary: '#4A90D9',
      accent: '#F97316',
      background_light: '#FFFFFF',
      background_dark: '#0F172A',
      text_light: '#FFFFFF',
      text_dark: '#1E293B',
      success: '#22C55E',
      warning: '#EAB308',
      error: '#EF4444',
    },
    fontes: {
      heading: { family: 'Outfit', weight: '800', url: 'https://fonts.googleapis.com/css2?family=Outfit:wght@800' },
      body: { family: 'Inter', weight: '400', url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400' },
      accent: { family: 'Cormorant Garamond', weight: '600', url: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600' },
    },
    guidelines: {
      logo_min_size_px: 80,
      logo_clear_space_px: 20,
      do_not_distort_logo: true,
      preferred_photo_style: 'fotografico',
      tone_of_voice: 'premium',
      banned_words: ['gratis', 'barato', 'clique aqui'],
      max_text_area_percent: 35,
    },
    logo_variants: {
      claro: 'design/logos/aurora-dark.png',
      escuro: 'design/logos/aurora-light.png',
      mono_preto: 'design/logos/aurora-black.png',
      mono_branco: 'design/logos/aurora-white.png',
      favicon: 'design/logos/aurora-favicon.png',
    },
    created_at: '2026-04-18T12:00:00.000Z',
    updated_at: '2026-05-06T12:00:00.000Z',
  },
  {
    id: 'dddddddd-dddd-4ddd-8ddd-dddddddddd02',
    company_id: COMPANY_ALPHA,
    client_id: CLIENT_NEXUS,
    nome: 'Nexus Industrial',
    empresa: 'Nexus Pumps',
    segmento: 'industria b2b',
    versao: 2,
    ativo: true,
    cores: {
      primary: '#0F172A',
      secondary: '#1D4ED8',
      accent: '#22C55E',
      background_light: '#F8FAFC',
      background_dark: '#020617',
      text_light: '#F8FAFC',
      text_dark: '#0F172A',
      success: '#22C55E',
      warning: '#F59E0B',
      error: '#DC2626',
    },
    fontes: {
      heading: { family: 'Space Grotesk', weight: '700', url: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700' },
      body: { family: 'Inter', weight: '400', url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400' },
    },
    guidelines: {
      logo_min_size_px: 88,
      logo_clear_space_px: 24,
      do_not_distort_logo: true,
      preferred_photo_style: '3d',
      tone_of_voice: 'tecnico',
      banned_words: ['imperdivel', 'compra agora'],
      max_text_area_percent: 32,
    },
    logo_variants: {
      claro: 'design/logos/nexus-dark.png',
      escuro: 'design/logos/nexus-light.png',
      favicon: 'design/logos/nexus-favicon.png',
    },
    created_at: '2026-04-24T12:00:00.000Z',
    updated_at: '2026-05-05T09:15:00.000Z',
  },
  {
    id: 'dddddddd-dddd-4ddd-8ddd-dddddddddd03',
    company_id: COMPANY_ALPHA,
    client_id: CLIENT_VIVA,
    nome: 'Viva Travel Stories',
    empresa: 'Viva Travel',
    segmento: 'turismo',
    versao: 6,
    ativo: true,
    cores: {
      primary: '#0E7490',
      secondary: '#38BDF8',
      accent: '#F97316',
      background_light: '#ECFEFF',
      background_dark: '#082F49',
      text_light: '#ECFEFF',
      text_dark: '#082F49',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
    },
    fontes: {
      heading: { family: 'Outfit', weight: '700', url: 'https://fonts.googleapis.com/css2?family=Outfit:wght@700' },
      body: { family: 'Manrope', weight: '500', url: 'https://fonts.googleapis.com/css2?family=Manrope:wght@500' },
      accent: { family: 'DM Serif Display', weight: '400', url: 'https://fonts.googleapis.com/css2?family=DM+Serif+Display' },
    },
    guidelines: {
      logo_min_size_px: 72,
      logo_clear_space_px: 16,
      do_not_distort_logo: true,
      preferred_photo_style: 'fotografico',
      tone_of_voice: 'emocional',
      banned_words: ['oferta imperdivel'],
      max_text_area_percent: 40,
    },
    logo_variants: {
      claro: 'design/logos/viva-dark.png',
      escuro: 'design/logos/viva-light.png',
      mono_branco: 'design/logos/viva-white.png',
      favicon: 'design/logos/viva-favicon.png',
    },
    created_at: '2026-03-28T12:00:00.000Z',
    updated_at: '2026-05-04T16:35:00.000Z',
  },
];

const initialJobs: DesignJob[] = [
  {
    id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee01',
    company_id: COMPANY_ALPHA,
    brand_kit_id: 'dddddddd-dddd-4ddd-8ddd-dddddddddd01',
    nome: 'Campanha check-up executivo',
    cliente_nome: 'Aurora Clinic',
    objetivo: 'Gerar awareness para servico premium',
    status: 'approved',
    requested_formats: ['ig-feed-square', 'ig-stories', 'li-post'],
    briefing_text: 'Criar campanha premium sobre check-up executivo com foco em confianca, cuidado e exclusividade.',
    tone: 'premium',
    notes: 'Usar imagens de rotina medica sofisticada e CTA leve.',
    created_by: USER_OPERATOR,
    created_at: '2026-05-02T14:00:00.000Z',
    updated_at: '2026-05-06T17:00:00.000Z',
    approved_at: '2026-05-06T18:12:00.000Z',
    variants: [
      {
        id: 'aaaa1111-1111-4111-8111-111111111111',
        label: 'Instagram Feed',
        format_slug: 'ig-feed-square',
        status: 'approved',
        progress: 100,
        headline: 'Check-up executivo com experiencia premium',
        body: 'Atendimento discreto, agenda fluida e um cuidado desenhado para liderancas.',
        cta: 'Agende sua avaliacao',
        background_tone: 'dark',
        dominant_colors: ['#1E3A5F', '#4A90D9', '#F97316'],
        width: 1080,
        height: 1080,
        safe_zone_ok: true,
        logo_size_px: 96,
        logo_contrast_ratio: 5.3,
        min_text_size_pt: 18,
        text_area_percent: 28,
        rendered_url: 'https://storage.fbr.com/design/aurora/job-1/feed-v4.png',
        output_formats: ['png', 'jpg', 'pdf'],
      },
      {
        id: 'aaaa1111-1111-4111-8111-111111111112',
        label: 'Stories',
        format_slug: 'ig-stories',
        status: 'approved',
        progress: 100,
        headline: 'Seu tempo vale um cuidado melhor',
        body: 'Fluxo rapido, equipe senior e visibilidade completa da sua saude executiva.',
        cta: 'Fale com a Aurora',
        background_tone: 'dark',
        dominant_colors: ['#1E3A5F', '#4A90D9', '#0F172A'],
        width: 1080,
        height: 1920,
        safe_zone_ok: true,
        logo_size_px: 88,
        logo_contrast_ratio: 5.1,
        min_text_size_pt: 20,
        text_area_percent: 24,
        rendered_url: 'https://storage.fbr.com/design/aurora/job-1/story-v4.png',
        output_formats: ['png', 'jpg'],
      },
    ],
  },
  {
    id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee02',
    company_id: COMPANY_ALPHA,
    brand_kit_id: 'dddddddd-dddd-4ddd-8ddd-dddddddddd02',
    nome: 'Feira de automacao B2B',
    cliente_nome: 'Nexus Pumps',
    objetivo: 'Abrir pipeline comercial para feira industrial',
    status: 'auto_review',
    requested_formats: ['li-post', 'ads-970x250', 'newsletter-header'],
    briefing_text: 'Criar pecas tecnicas para divulgar participacao na feira de automacao, com foco em engenharia e escala.',
    tone: 'tecnico',
    notes: 'Evitar apelo promocional agressivo.',
    created_by: USER_OPERATOR,
    created_at: '2026-05-05T10:00:00.000Z',
    updated_at: '2026-05-08T09:10:00.000Z',
    variants: [
      {
        id: 'aaaa1111-1111-4111-8111-111111111121',
        label: 'LinkedIn Post',
        format_slug: 'li-post',
        status: 'review_blocked',
        progress: 82,
        headline: 'Arquiteturas industriais que escalam com previsibilidade',
        body: 'Conheca a Nexus na feira e descubra como reduzir downtime com telemetria aplicada.',
        cta: 'Reserve uma conversa tecnica',
        background_tone: 'light',
        dominant_colors: ['#1D4ED8', '#0F172A', '#22C55E'],
        width: 1200,
        height: 627,
        safe_zone_ok: true,
        logo_size_px: 86,
        logo_contrast_ratio: 4.6,
        min_text_size_pt: 14,
        text_area_percent: 31,
        rendered_url: 'https://storage.fbr.com/design/nexus/job-2/linkedin-v2.png',
        output_formats: ['png', 'jpg', 'pdf'],
      },
      {
        id: 'aaaa1111-1111-4111-8111-111111111122',
        label: 'Billboard',
        format_slug: 'ads-970x250',
        status: 'processing',
        progress: 64,
        headline: 'Conheca nossa plataforma GRATIS na feira',
        body: 'Clique aqui e receba o roteiro completo de demos ao vivo.',
        cta: 'Entrar agora',
        background_tone: 'dark',
        dominant_colors: ['#1D4ED8', '#0F172A', '#F97316'],
        width: 970,
        height: 250,
        safe_zone_ok: false,
        logo_size_px: 72,
        logo_contrast_ratio: 3.2,
        min_text_size_pt: 10,
        text_area_percent: 46,
        output_formats: ['png', 'jpg', 'zip'],
      },
    ],
  },
  {
    id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee03',
    company_id: COMPANY_ALPHA,
    brand_kit_id: 'dddddddd-dddd-4ddd-8ddd-dddddddddd03',
    nome: 'Media kit temporada inverno',
    cliente_nome: 'Viva Travel',
    objetivo: 'Atualizar material comercial e PDF executivo',
    status: 'render',
    requested_formats: ['media-kit', 'blog-cover', 'pptx-widescreen'],
    briefing_text: 'Atualizar media kit com narrativas de viagens de inverno, dados de audiencia e visual inspiracional.',
    tone: 'emocional',
    notes: 'Aproveitar paisagens frias e depoimentos curtos.',
    created_by: USER_OPERATOR,
    created_at: '2026-05-06T08:30:00.000Z',
    updated_at: '2026-05-08T11:00:00.000Z',
    variants: [
      {
        id: 'aaaa1111-1111-4111-8111-111111111131',
        label: 'Media kit A4',
        format_slug: 'media-kit',
        status: 'ready',
        progress: 97,
        headline: 'Inverno que converte inspiracao em audiencia',
        body: 'Inventario premium, audiencia fiel e narrativas que se transformam em lembranca de marca.',
        cta: 'Solicite tabela comercial',
        background_tone: 'light',
        dominant_colors: ['#0E7490', '#38BDF8', '#F97316'],
        width: 2480,
        height: 3508,
        safe_zone_ok: true,
        logo_size_px: 92,
        logo_contrast_ratio: 5.4,
        min_text_size_pt: 13,
        text_area_percent: 33,
        rendered_url: 'https://storage.fbr.com/design/viva/job-3/media-kit-v6.pdf',
        output_formats: ['pdf', 'pptx', 'zip'],
      },
    ],
  },
];

const initialTemplates: DesignTemplate[] = [
  {
    id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbb001',
    nome: 'Editorial premium split',
    tipo: 'social',
    format_slugs: ['ig-feed-square', 'li-post'],
    summary: 'Layout editorial com bloco tipografico e foto lateral.',
    dynamic_tokens: ['{{headline}}', '{{body}}', '{{logo}}'],
  },
  {
    id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbb002',
    nome: 'Hero performance',
    tipo: 'ads',
    format_slugs: ['hero-desktop', 'hero-mobile', 'ads-970x250'],
    summary: 'Template para campanhas com CTA de alta prioridade.',
    dynamic_tokens: ['{{headline}}', '{{cta}}', '{{asset}}'],
  },
  {
    id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbb003',
    nome: 'Media kit chapter',
    tipo: 'docs',
    format_slugs: ['media-kit', 'pptx-widescreen'],
    summary: 'Slide/doc page para dados comerciais e storytelling.',
    dynamic_tokens: ['{{audience}}', '{{headline}}', '{{brand_colors}}'],
  },
];

const initialAgentSlots: DesignAgentSlot[] = [
  { slot: 'compositor', title: 'Compositor', description: 'Pillow + brand kit application', status: 'processing', model: 'claude-sonnet-4-20250514' },
  { slot: 'asset_finder', title: 'Asset Finder', description: 'Cascade Unsplash -> Pexels -> Pixabay -> MidJourney', status: 'processing', model: 'claude-haiku-4-20250507' },
  { slot: 'revisor', title: 'Revisor', description: 'Auto-review rules + export gate', status: 'idle', model: 'claude-sonnet-4-20250514' },
];

const availableArvaAgents: ArvaAgent[] = [
  { id: 'design-agent-1', name: 'Helena Compositor', role: 'direction + composition', tags: ['design', 'criativo', 'branding'], status: 'active' },
  { id: 'design-agent-2', name: 'Caio Asset Finder', role: 'stock intelligence', tags: ['design', 'criativo'], status: 'active' },
  { id: 'design-agent-3', name: 'Lia Review Ops', role: 'brand safety reviewer', tags: ['branding', 'design'], status: 'active' },
  { id: 'design-agent-4', name: 'Mika Motion Lab', role: 'motion graphics', tags: ['motion', 'criativo'], status: 'inactive' },
  { id: 'design-agent-5', name: 'Nora Pitch Deck', role: 'presentation designer', tags: ['design', 'pitch'], status: 'active' },
];

const initialActivityLog: DesignActivityLog[] = [
  { id: 'cccccccc-cccc-4ccc-8ccc-cccccccc0001', agent: 'Asset Finder', level: 'info', message: 'Unsplash cache hit for "executive healthcare" (24h TTL).', timestamp: '2026-05-08T11:00:10.000Z' },
  { id: 'cccccccc-cccc-4ccc-8ccc-cccccccc0002', agent: 'Compositor', level: 'info', message: 'Applied Aurora Premium kit v4 to IG story variant.', timestamp: '2026-05-08T11:00:18.000Z' },
  { id: 'cccccccc-cccc-4ccc-8ccc-cccccccc0003', agent: 'Revisor', level: 'warn', message: 'Billboard variant blocked: spam words + safe zone overflow.', timestamp: '2026-05-08T11:00:29.000Z' },
  { id: 'cccccccc-cccc-4ccc-8ccc-cccccccc0004', agent: 'Exporter', level: 'info', message: 'Queued PDF + PPTX export for Viva Travel media kit.', timestamp: '2026-05-08T11:00:44.000Z' },
];

let brandKits = clone(initialBrandKits);
let jobs = clone(initialJobs);
let templates = clone(initialTemplates);
let agentSlots = clone(initialAgentSlots);
let activityLog = clone(initialActivityLog);

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function now() {
  return new Date().toISOString();
}

function formatBySlug(slug: string) {
  const format = formatCatalog.find((item) => item.slug === slug);
  if (!format) {
    throw new DesignValidationError(`Unknown format slug: ${slug}.`, 422);
  }
  return format;
}

function parseJsonObject(input: unknown) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new DesignValidationError('JSON object payload is required.', 400);
  }
  return input;
}

function normalizeZodError(error: z.ZodError) {
  const hasMissingRequired = error.issues.some((issue) => issue.code === 'invalid_type' && issue.received === 'undefined');
  return new DesignValidationError(
    hasMissingRequired ? 'Required fields are missing.' : 'Payload validation failed.',
    hasMissingRequired ? 400 : 422,
    error.issues,
  );
}

function hexToRgb(hex: string) {
  const clean = hex.replace('#', '');
  return {
    r: Number.parseInt(clean.slice(0, 2), 16),
    g: Number.parseInt(clean.slice(2, 4), 16),
    b: Number.parseInt(clean.slice(4, 6), 16),
  };
}

function rgbToXyz({ r, g, b }: { r: number; g: number; b: number }) {
  const normalize = (value: number) => {
    const normalized = value / 255;
    return normalized > 0.04045 ? ((normalized + 0.055) / 1.055) ** 2.4 : normalized / 12.92;
  };
  const rr = normalize(r);
  const gg = normalize(g);
  const bb = normalize(b);

  return {
    x: rr * 0.4124 + gg * 0.3576 + bb * 0.1805,
    y: rr * 0.2126 + gg * 0.7152 + bb * 0.0722,
    z: rr * 0.0193 + gg * 0.1192 + bb * 0.9505,
  };
}

function xyzToLab({ x, y, z }: { x: number; y: number; z: number }) {
  const ref = { x: 0.95047, y: 1, z: 1.08883 };
  const transform = (value: number) => (value > 0.008856 ? value ** (1 / 3) : 7.787 * value + 16 / 116);
  const fx = transform(x / ref.x);
  const fy = transform(y / ref.y);
  const fz = transform(z / ref.z);
  return {
    l: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

function deltaE(left: string, right: string) {
  const a = xyzToLab(rgbToXyz(hexToRgb(left)));
  const b = xyzToLab(rgbToXyz(hexToRgb(right)));
  return Math.sqrt((b.l - a.l) ** 2 + (b.a - a.a) ** 2 + (b.b - a.b) ** 2);
}

function hasLinks(text: string) {
  return /(https?:\/\/|www\.|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i.test(text);
}

function buildRuleResults(brandKit: BrandKit, variant: DesignVariant): { results: ReviewRuleResult[]; overall: DesignReviewPack['overall_status']; deltaEValue: number } {
  const format = formatBySlug(variant.format_slug);
  const copy = `${variant.headline} ${variant.body} ${variant.cta ?? ''}`.trim();
  const bannedWords = [...brandKit.guidelines.banned_words, 'gratis', 'clique aqui', 'oferta imperdivel', 'compra agora'].map((item) => item.toLowerCase());
  const spamHit = bannedWords.find((item) => copy.toLowerCase().includes(item));
  const ratioExpected = format.width / format.height;
  const ratioActual = variant.width / variant.height;
  const ratioDiffPercent = Math.abs((ratioActual - ratioExpected) / ratioExpected) * 100;
  const palette = Object.values(brandKit.cores).filter(Boolean) as string[];
  const deltaEValue = Math.min(
    ...variant.dominant_colors.map((candidate) => Math.min(...palette.map((color) => deltaE(candidate, color)))),
  );
  const rules: ReviewRuleResult[] = [
    {
      key: 'no_links',
      status: hasLinks(copy) ? 'fail' : 'pass',
      detail: hasLinks(copy) ? 'Text contains URL/email markers.' : 'Copy is clean from links.',
    },
    {
      key: 'no_spam_words',
      status: spamHit ? 'fail' : 'pass',
      detail: spamHit ? `Blocked by banned/spam word: "${spamHit}".` : 'No banned marketing expressions found.',
    },
    {
      key: 'correct_proportions',
      status: ratioDiffPercent > 2 ? 'fail' : 'pass',
      detail: ratioDiffPercent > 2 ? 'Rendered dimensions drift from requested format.' : 'Aspect ratio matches format contract.',
      metric_label: 'Aspect drift',
      metric_value: `${ratioDiffPercent.toFixed(1)}%`,
    },
    {
      key: 'safe_zone',
      status: variant.safe_zone_ok ? 'pass' : 'fail',
      detail: variant.safe_zone_ok ? 'Critical elements are inside safe zone.' : 'Logo or text escaped safe zone bounds.',
    },
    {
      key: 'brand_colors',
      status: deltaEValue < 30 ? 'pass' : 'warn',
      detail: deltaEValue < 30 ? 'Dominant colors stay inside brand tolerance.' : 'Dominant colors drift from the palette tolerance.',
      metric_label: 'Delta E',
      metric_value: deltaEValue.toFixed(1),
    },
    {
      key: 'logo_visibility',
      status: variant.logo_size_px >= brandKit.guidelines.logo_min_size_px && variant.logo_contrast_ratio >= 4 ? 'pass' : 'fail',
      detail:
        variant.logo_size_px >= brandKit.guidelines.logo_min_size_px && variant.logo_contrast_ratio >= 4
          ? 'Logo size and contrast are compliant.'
          : 'Logo is too small or lacks contrast.',
      metric_label: 'Logo',
      metric_value: `${variant.logo_size_px}px / ${variant.logo_contrast_ratio.toFixed(1)}:1`,
    },
    {
      key: 'text_legibility',
      status: variant.min_text_size_pt >= 12 ? 'pass' : 'warn',
      detail: variant.min_text_size_pt >= 12 ? 'Minimum text size is readable.' : 'Text drops below 12pt equivalent.',
      metric_label: 'Min text',
      metric_value: `${variant.min_text_size_pt.toFixed(0)}pt`,
    },
    {
      key: 'spam_ratio',
      status: variant.text_area_percent <= brandKit.guidelines.max_text_area_percent ? 'pass' : 'warn',
      detail:
        variant.text_area_percent <= brandKit.guidelines.max_text_area_percent
          ? 'Text occupancy is within policy.'
          : 'Text occupancy is above policy threshold.',
      metric_label: 'Text area',
      metric_value: `${variant.text_area_percent.toFixed(0)}%`,
    },
  ];
  const hasFail = rules.some((rule) => rule.status === 'fail');
  const hasWarn = rules.some((rule) => rule.status === 'warn');
  return { results: rules, overall: hasFail ? 'blocked' : hasWarn ? 'warn' : 'approved', deltaEValue };
}

function resolveBrandKit(context: DesignRequestContext, brandKitId: string) {
  const brandKit = brandKits.find((item) => item.company_id === context.companyId && item.id === brandKitId);
  if (!brandKit) {
    throw new DesignValidationError('Brand kit not found.', 404);
  }
  return brandKit;
}

function resolveJob(context: DesignRequestContext, jobId: string) {
  const job = jobs.find((item) => item.company_id === context.companyId && item.id === jobId);
  if (!job) {
    throw new DesignValidationError('Design job not found.', 404);
  }
  return job;
}

function allDeliverables(): Deliverable[] {
  return jobs.flatMap((job) =>
    job.variants.flatMap((variant) =>
      variant.output_formats.map((format) => ({
        id: `${variant.id}-${format}` as `${string}-${string}`,
        job_id: job.id!,
        variant_id: variant.id!,
        format,
        width: variant.width,
        height: variant.height,
        status: variant.status === 'published' ? 'publicado' : variant.status === 'approved' ? 'aprovado' : variant.rendered_url ? 'pronto' : 'rascunho',
        file_url:
          variant.rendered_url?.replace(/\.[a-z]+$/i, `.${format === 'jpg' ? 'jpg' : format}`) ??
          `https://storage.fbr.com/design/${job.brand_kit_id}/${job.id}/${variant.id}.${format}`,
      })),
    ),
  );
}

function allReviewPacks(context: DesignRequestContext): DesignReviewPack[] {
  return jobs
    .filter((job) => job.company_id === context.companyId)
    .flatMap((job) => {
      const brandKit = resolveBrandKit(context, job.brand_kit_id);
      return job.variants.map((variant) => {
        const { results, overall, deltaEValue } = buildRuleResults(brandKit, variant);
        return {
          job_id: job.id!,
          variant_id: variant.id!,
          overall_status: overall,
          delta_e: Number(deltaEValue.toFixed(2)),
          rules: results,
        };
      });
    });
}

function matchesSearch(job: DesignJob, search?: string) {
  if (!search) return true;
  const haystack = `${job.nome} ${job.cliente_nome} ${job.briefing_text}`.toLowerCase();
  return haystack.includes(search.toLowerCase());
}

function buildDashboard(context: DesignRequestContext): DesignDashboardKpis {
  const scopedBrandKits = listBrandKits(context);
  const scopedJobs = jobs.filter((item) => item.company_id === context.companyId);
  const reviewPacks = allReviewPacks(context);
  const approvedVariants = scopedJobs.flatMap((job) => job.variants).filter((variant) => ['approved', 'published'].includes(variant.status)).length;

  return {
    clientes_ativos: new Set(scopedBrandKits.map((item) => item.client_id)).size,
    brand_kits_ativos: scopedBrandKits.filter((item) => item.ativo).length,
    jobs_ativos: scopedJobs.filter((item) => !['approved', 'published'].includes(item.status)).length,
    artes_prontas: approvedVariants,
    taxa_aprovacao:
      reviewPacks.length === 0
        ? 0
        : Number(
            ((reviewPacks.filter((item) => item.overall_status === 'approved').length / reviewPacks.length) * 100).toFixed(1),
          ),
    formatos_catalogados: formatCatalog.length,
    templates_ativos: templates.length,
  };
}

export function resetDesignStoreForTests() {
  brandKits = clone(initialBrandKits);
  jobs = clone(initialJobs);
  templates = clone(initialTemplates);
  agentSlots = clone(initialAgentSlots);
  activityLog = clone(initialActivityLog);
}

resetDesignStoreForTests();

export function getDesignTestCompanyIds() {
  return { alpha: COMPANY_ALPHA, user: USER_OPERATOR };
}

export function getDesignArvaAgents() {
  return clone(availableArvaAgents);
}

export function parseDesignJobsQuery(url: string): DesignJobsQuery {
  const params = new URL(url).searchParams;
  const rawStatus = params.getAll('status').flatMap((item) => item.split(',')).filter(Boolean);

  try {
    return DesignJobsQuerySchema.parse({
      busca: params.get('busca') ?? undefined,
      status: rawStatus.length > 0 ? rawStatus : undefined,
      brand_kit_id: params.get('brand_kit_id') ?? undefined,
      page: params.get('page') ?? undefined,
      page_size: params.get('page_size') ?? undefined,
    });
  } catch (error) {
    if (error instanceof z.ZodError) throw normalizeZodError(error);
    throw error;
  }
}

export function listFormats() {
  return clone(formatCatalog);
}

export function listBrandKits(context: DesignRequestContext) {
  return brandKits.filter((item) => item.company_id === context.companyId);
}

export function getBrandKit(context: DesignRequestContext, id: string) {
  return clone(resolveBrandKit(context, id));
}

export function createBrandKit(context: DesignRequestContext, data: unknown) {
  const input = parseJsonObject(data);

  try {
    const validated = BrandKitSchema.parse({
      ...input,
      id: crypto.randomUUID(),
      company_id: context.companyId,
      created_at: now(),
      updated_at: now(),
    });
    brandKits.unshift(validated);
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) throw normalizeZodError(error);
    throw error;
  }
}

export function updateBrandKit(context: DesignRequestContext, id: string, data: unknown) {
  const current = resolveBrandKit(context, id);
  const input = parseJsonObject(data);

  try {
    const validated = BrandKitSchema.parse({
      ...current,
      ...input,
      cores: { ...current.cores, ...((input as { cores?: object }).cores ?? {}) },
      fontes: {
        ...current.fontes,
        ...((input as { fontes?: object }).fontes ?? {}),
      },
      guidelines: {
        ...current.guidelines,
        ...((input as { guidelines?: object }).guidelines ?? {}),
      },
      logo_variants: {
        ...current.logo_variants,
        ...((input as { logo_variants?: object }).logo_variants ?? {}),
      },
      updated_at: now(),
      versao: current.versao + 1,
    });
    brandKits = brandKits.map((item) => (item.id === id ? validated : item));
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) throw normalizeZodError(error);
    throw error;
  }
}

export function listDesignJobs(context: DesignRequestContext, query: Partial<DesignJobsQuery> = {}) {
  const parsed = DesignJobsQuerySchema.parse(query);
  const scoped = jobs.filter((item) => item.company_id === context.companyId);
  const filtered = scoped.filter((job) => {
    if (!matchesSearch(job, parsed.busca)) return false;
    if (parsed.status && !parsed.status.includes(job.status)) return false;
    if (parsed.brand_kit_id && job.brand_kit_id !== parsed.brand_kit_id) return false;
    return true;
  });

  const start = (parsed.page - 1) * parsed.page_size;
  const items = filtered.slice(start, start + parsed.page_size);

  return {
    items: clone(items),
    pagination: {
      page: parsed.page,
      page_size: parsed.page_size,
      total: filtered.length,
      total_pages: Math.max(1, Math.ceil(filtered.length / parsed.page_size)),
    },
  };
}

export function getDesignJob(context: DesignRequestContext, id: string) {
  return clone(resolveJob(context, id));
}

export function createDesignJob(context: DesignRequestContext, data: unknown) {
  const input = parseJsonObject(data);

  try {
    const requestedFormats = Array.isArray((input as { requested_formats?: unknown[] }).requested_formats)
      ? ((input as { requested_formats: string[] }).requested_formats)
      : [];
    const validatedVariants = requestedFormats.map((slug, index) => {
      const format = formatBySlug(slug);
      return {
        id: crypto.randomUUID(),
        label: `Variant ${index + 1}`,
        format_slug: slug,
        status: 'queued' as const,
        progress: 12,
        headline: (input as { headline?: string }).headline ?? 'New design request',
        body: (input as { body?: string }).body ?? 'Awaiting composition pipeline.',
        cta: (input as { cta?: string }).cta ?? 'Review creative',
        background_tone: 'dark' as const,
        dominant_colors: [((input as { dominant_color?: string }).dominant_color ?? '#F97316')],
        width: format.width,
        height: format.height,
        safe_zone_ok: true,
        logo_size_px: 80,
        logo_contrast_ratio: 4.5,
        min_text_size_pt: 14,
        text_area_percent: 24,
        output_formats: ['png', 'jpg'],
      };
    });

    const validated = DesignJobSchema.parse({
      ...input,
      id: crypto.randomUUID(),
      company_id: context.companyId,
      created_by: context.userId,
      created_at: now(),
      updated_at: now(),
      variants: validatedVariants,
    });
    jobs.unshift(validated);
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) throw normalizeZodError(error);
    throw error;
  }
}

export function updateDesignJob(context: DesignRequestContext, id: string, data: unknown) {
  const current = resolveJob(context, id);
  const input = parseJsonObject(data);

  try {
    const next = DesignJobSchema.parse({
      ...current,
      ...input,
      updated_at: now(),
    });
    jobs = jobs.map((item) => (item.id === id ? next : item));
    return next;
  } catch (error) {
    if (error instanceof z.ZodError) throw normalizeZodError(error);
    throw error;
  }
}

export function listTemplates() {
  return clone(templates);
}

export function listAgentSlots() {
  return clone(agentSlots);
}

export function listActivityLog() {
  return clone(activityLog);
}

export function listDeliverables(context: DesignRequestContext, jobId?: string) {
  return allDeliverables().filter((item) => {
    resolveJob(context, item.job_id);
    return !jobId || item.job_id === jobId;
  });
}

export function getReviewPack(context: DesignRequestContext, jobId: string, variantId?: string): DesignReviewPack {
  const packs = allReviewPacks(context).filter((item) => item.job_id === jobId);
  if (packs.length === 0) {
    throw new DesignValidationError('Review pack not found.', 404);
  }
  if (!variantId) return packs[0]!;
  const pack = packs.find((item) => item.variant_id === variantId);
  if (!pack) throw new DesignValidationError('Variant review not found.', 404);
  return pack;
}

export function getDesignDashboardKpis(context: DesignRequestContext) {
  return buildDashboard(context);
}

export function getDesignModuleSnapshot(context: DesignRequestContext): DesignModuleSnapshot {
  return {
    kpis: buildDashboard(context),
    formats: listFormats(),
    brand_kits: listBrandKits(context),
    jobs: listDesignJobs(context, { page_size: 50 }).items,
    templates: listTemplates(),
    agent_slots: listAgentSlots(),
    activity_log: listActivityLog(),
    deliverables: listDeliverables(context),
    review_packs: allReviewPacks(context),
  };
}

export function previewBrandKitWebhook(context: DesignRequestContext, brandKitId: string): DesignWebhookPreview {
  const brandKit = resolveBrandKit(context, brandKitId);
  const payload = {
    brand_kit_id: brandKit.id!,
    empresa_id: brandKit.company_id,
    cliente_nome: brandKit.empresa,
    versao: brandKit.versao,
    updated_at: brandKit.updated_at ?? now(),
    changed_fields: ['cores', 'fontes', 'guidelines'],
    alterado_por: context.userId,
  };

  return {
    event: 'brand_kit.updated',
    signature: createHmac('sha256', WEBHOOK_SECRET).update(JSON.stringify(payload)).digest('hex'),
    payload,
  };
}

export function approveCreativeForCampaign(context: DesignRequestContext, arteId: string): DesignSalesApproval {
  const deliverable = allDeliverables().find((item) => item.id === arteId);
  if (!deliverable) {
    throw new DesignValidationError('Creative not found.', 404);
  }

  const job = resolveJob(context, deliverable.job_id);
  const variant = job.variants.find((item) => item.id === deliverable.variant_id);
  if (!variant) throw new DesignValidationError('Creative variant not found.', 404);

  if (variant.status === 'processing' || variant.status === 'queued') {
    throw new DesignValidationError('Creative is still being generated.', 400);
  }
  if (variant.status === 'review_blocked') {
    throw new DesignValidationError('Creative requires approval before campaign handoff.', 400);
  }

  return {
    arte_id: arteId,
    status: variant.status === 'published' ? 'publicado' : 'aprovado',
    approved_at: job.approved_at ?? now(),
    approved_by: 'design.supervisor@fbr.com',
    urls: {
      png: variant.rendered_url?.replace(/\.[a-z]+$/i, '.png'),
      jpg: variant.rendered_url?.replace(/\.[a-z]+$/i, '.jpg'),
      pdf: variant.output_formats.includes('pdf') ? variant.rendered_url?.replace(/\.[a-z]+$/i, '.pdf') : undefined,
    },
    dimensoes: { width: variant.width, height: variant.height },
    formato: variant.format_slug,
  };
}

export function exportCreative(context: DesignRequestContext, jobId: string, requestData: unknown) {
  const job = resolveJob(context, jobId);
  try {
    const request = DesignExportRequestSchema.parse(requestData) as DesignExportRequest;
    const variant = job.variants[0];
    if (!variant) {
      throw new DesignValidationError('No creative variants are available for export.', 409);
    }
    return {
      format: request.format,
      url: `https://storage.fbr.com/design/${context.companyId}/exports/${job.id}/${variant.id}.${request.format}`,
      job_id: job.id,
    };
  } catch (error) {
    if (error instanceof z.ZodError) throw normalizeZodError(error);
    throw error;
  }
}
