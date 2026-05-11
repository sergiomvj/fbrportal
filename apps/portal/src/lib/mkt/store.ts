import { z } from 'zod';
import {
  Campaign,
  CampaignSchema,
  CampaignsQuery,
  CampaignsQuerySchema,
  Strategy,
  ContentCalendar,
  AnalyticsSnapshot,
  MktDashboardKpis,
} from './types';

export interface MktRequestContext {
  companyId: string;
  userId: string;
  moduleSource: string;
}

export class MktValidationError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 409 | 422,
    readonly issues?: unknown,
  ) {
    super(message);
  }
}

const COMPANY_ALPHA = '11111111-1111-4111-8111-111111111111';
const COMPANY_BETA = '22222222-2222-4222-8222-222222222222';
const USER_SYSTEM = '33333333-3333-4333-8333-333333333333';

const initialCampaigns: Campaign[] = [
  {
    id: 'mkt-camp-0001-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    company_id: COMPANY_ALPHA,
    nome: 'Lancamento Produto X',
    status: 'ativa',
    tipo: 'produto',
    budget: 25000,
    gasto: 18500,
    roi: 3.2,
    data_inicio: '2026-03-01',
    data_fim: '2026-06-30',
    canal: 'Google Ads',
    responsavel: 'Maria Silva',
    created_at: '2026-02-15T10:00:00.000Z',
  },
  {
    id: 'mkt-camp-0002-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
    company_id: COMPANY_ALPHA,
    nome: 'Awareness Marca Q2',
    status: 'ativa',
    tipo: 'awareness',
    budget: 40000,
    gasto: 32000,
    roi: 1.8,
    data_inicio: '2026-04-01',
    data_fim: '2026-06-30',
    canal: 'Instagram',
    responsavel: 'Joao Santos',
    created_at: '2026-03-20T10:00:00.000Z',
  },
  {
    id: 'mkt-camp-0003-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
    company_id: COMPANY_ALPHA,
    nome: 'Captacao Leads B2B',
    status: 'ativa',
    tipo: 'leads',
    budget: 15000,
    gasto: 12000,
    roi: 4.5,
    data_inicio: '2026-04-15',
    data_fim: '2026-07-15',
    canal: 'LinkedIn',
    responsavel: 'Ana Costa',
    created_at: '2026-04-01T10:00:00.000Z',
  },
  {
    id: 'mkt-camp-0004-aaaa-4aaa-8aaa-aaaaaaaaaaa4',
    company_id: COMPANY_ALPHA,
    nome: 'Remarketing Carrinho Abandonado',
    status: 'pausada',
    tipo: 'remarketing',
    budget: 8000,
    gasto: 6500,
    roi: 5.1,
    data_inicio: '2026-02-01',
    canal: 'Google Ads',
    responsavel: 'Carlos Lima',
    created_at: '2026-01-20T10:00:00.000Z',
  },
  {
    id: 'mkt-camp-0005-aaaa-4aaa-8aaa-aaaaaaaaaaa5',
    company_id: COMPANY_ALPHA,
    nome: 'Institucional Empresa',
    status: 'concluida',
    tipo: 'institucional',
    budget: 20000,
    gasto: 20000,
    roi: 1.2,
    data_inicio: '2026-01-01',
    data_fim: '2026-03-31',
    canal: 'YouTube',
    responsavel: 'Maria Silva',
    created_at: '2025-12-15T10:00:00.000Z',
  },
  {
    id: 'mkt-camp-0006-aaaa-4aaa-8aaa-aaaaaaaaaaa6',
    company_id: COMPANY_ALPHA,
    nome: 'Campanha Dia das Maes',
    status: 'concluida',
    tipo: 'conversao',
    budget: 30000,
    gasto: 28000,
    roi: 2.9,
    data_inicio: '2026-04-20',
    data_fim: '2026-05-10',
    canal: 'Meta Ads',
    responsavel: 'Joao Santos',
    created_at: '2026-04-01T10:00:00.000Z',
  },
  {
    id: 'mkt-camp-0007-aaaa-4aaa-8aaa-aaaaaaaaaaa7',
    company_id: COMPANY_ALPHA,
    nome: 'Black Friday 2026',
    status: 'rascunho',
    tipo: 'conversao',
    budget: 60000,
    gasto: 0,
    roi: 0,
    data_inicio: '2026-11-15',
    data_fim: '2026-11-30',
    canal: 'Multi-canal',
    responsavel: 'Ana Costa',
    created_at: '2026-05-01T10:00:00.000Z',
  },
  {
    id: 'mkt-camp-0008-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
    company_id: COMPANY_BETA,
    nome: 'Beta Launch Campaign',
    status: 'ativa',
    tipo: 'produto',
    budget: 18000,
    gasto: 10000,
    roi: 2.1,
    data_inicio: '2026-04-01',
    data_fim: '2026-07-01',
    canal: 'Google Ads',
    responsavel: 'Pedro Alves',
    created_at: '2026-03-15T10:00:00.000Z',
  },
];

const initialStrategies: Strategy[] = [
  {
    id: 'mkt-str-0001-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    company_id: COMPANY_ALPHA,
    nome: 'Crescimento Organico 2026',
    descricao: 'Estrategia focada em crescimento organico via SEO e conteudo de valor para aumentar autoridade no mercado B2B.',
    pilares: ['seo', 'conteudo', 'social_media'],
    ativa: true,
    created_at: '2026-01-10T10:00:00.000Z',
  },
  {
    id: 'mkt-str-0002-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
    company_id: COMPANY_ALPHA,
    nome: 'Performance Digital Q2',
    descricao: 'Foco em midia paga e remarketing para maximizar conversoes no segundo trimestre.',
    pilares: ['midia_paga', 'email', 'conteudo'],
    ativa: true,
    created_at: '2026-03-01T10:00:00.000Z',
  },
  {
    id: 'mkt-str-0003-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
    company_id: COMPANY_ALPHA,
    nome: 'Influenciadores Nordeste',
    descricao: 'Parcerias com macro e micro influenciadores da regiao Nordeste para expandir alcance regional.',
    pilares: ['influenciadores', 'social_media'],
    ativa: true,
    created_at: '2026-02-15T10:00:00.000Z',
  },
];

const initialCalendar: ContentCalendar[] = [
  {
    id: 'mkt-cal-0001-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    company_id: COMPANY_ALPHA,
    data: '2026-05-07',
    tipo: 'post',
    plataforma: 'instagram',
    titulo: 'Lancamento Produto X - Carrossel',
    status: 'aprovado',
    responsavel: 'Maria Silva',
    campanha_id: 'mkt-camp-0001-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    created_at: '2026-05-01T10:00:00.000Z',
  },
  {
    id: 'mkt-cal-0002-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
    company_id: COMPANY_ALPHA,
    data: '2026-05-08',
    tipo: 'reels',
    plataforma: 'instagram',
    titulo: 'Bastidores da equipe',
    status: 'em_producao',
    responsavel: 'Joao Santos',
    created_at: '2026-05-02T10:00:00.000Z',
  },
  {
    id: 'mkt-cal-0003-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
    company_id: COMPANY_ALPHA,
    data: '2026-05-09',
    tipo: 'blog',
    plataforma: 'blog',
    titulo: 'Como aumentar a produtividade em 2026',
    status: 'planejado',
    responsavel: 'Ana Costa',
    created_at: '2026-05-03T10:00:00.000Z',
  },
  {
    id: 'mkt-cal-0004-aaaa-4aaa-8aaa-aaaaaaaaaaa4',
    company_id: COMPANY_ALPHA,
    data: '2026-05-10',
    tipo: 'email',
    plataforma: 'email',
    titulo: 'Newsletter semanal - Edicao 18',
    status: 'publicado',
    responsavel: 'Carlos Lima',
    created_at: '2026-05-04T10:00:00.000Z',
  },
  {
    id: 'mkt-cal-0005-aaaa-4aaa-8aaa-aaaaaaaaaaa5',
    company_id: COMPANY_ALPHA,
    data: '2026-05-12',
    tipo: 'video',
    plataforma: 'youtube',
    titulo: 'Tutorial Produto X',
    status: 'em_producao',
    responsavel: 'Maria Silva',
    campanha_id: 'mkt-camp-0001-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    created_at: '2026-05-05T10:00:00.000Z',
  },
  {
    id: 'mkt-cal-0006-aaaa-4aaa-8aaa-aaaaaaaaaaa6',
    company_id: COMPANY_ALPHA,
    data: '2026-05-14',
    tipo: 'story',
    plataforma: 'instagram',
    titulo: 'Enquete - Proximo conteudo',
    status: 'planejado',
    responsavel: 'Joao Santos',
    created_at: '2026-05-06T10:00:00.000Z',
  },
];

const initialAnalytics: AnalyticsSnapshot[] = [
  {
    id: 'mkt-anx-0001-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    company_id: COMPANY_ALPHA,
    periodo: '2025-12',
    impressions: 285000,
    clicks: 14200,
    ctr: 4.98,
    conversions: 420,
    cac: 45.5,
    ltv: 890,
    created_at: '2026-01-01T10:00:00.000Z',
  },
  {
    id: 'mkt-anx-0002-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
    company_id: COMPANY_ALPHA,
    periodo: '2026-01',
    impressions: 310000,
    clicks: 15500,
    ctr: 5.0,
    conversions: 480,
    cac: 42.0,
    ltv: 920,
    created_at: '2026-02-01T10:00:00.000Z',
  },
  {
    id: 'mkt-anx-0003-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
    company_id: COMPANY_ALPHA,
    periodo: '2026-02',
    impressions: 340000,
    clicks: 17800,
    ctr: 5.24,
    conversions: 530,
    cac: 39.8,
    ltv: 950,
    created_at: '2026-03-01T10:00:00.000Z',
  },
  {
    id: 'mkt-anx-0004-aaaa-4aaa-8aaa-aaaaaaaaaaa4',
    company_id: COMPANY_ALPHA,
    periodo: '2026-03',
    impressions: 380000,
    clicks: 19200,
    ctr: 5.05,
    conversions: 590,
    cac: 37.2,
    ltv: 980,
    created_at: '2026-04-01T10:00:00.000Z',
  },
  {
    id: 'mkt-anx-0005-aaaa-4aaa-8aaa-aaaaaaaaaaa5',
    company_id: COMPANY_ALPHA,
    periodo: '2026-04',
    impressions: 420000,
    clicks: 21500,
    ctr: 5.12,
    conversions: 650,
    cac: 35.5,
    ltv: 1020,
    created_at: '2026-05-01T10:00:00.000Z',
  },
];

let campaigns: Campaign[] = [];
let strategies: Strategy[] = [];
let calendar: ContentCalendar[] = [];
let analytics: AnalyticsSnapshot[] = [];

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function now() {
  return new Date().toISOString();
}

function parseJsonObject(input: unknown) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new MktValidationError('JSON object payload is required.', 400);
  }
  return input;
}

function normalizeZodError(error: z.ZodError) {
  const hasMissingRequired = error.issues.some((issue) => issue.code === 'invalid_type' && issue.received === 'undefined');
  return new MktValidationError(hasMissingRequired ? 'Required fields are missing.' : 'Payload validation failed.', hasMissingRequired ? 400 : 422, error.issues);
}

export function resetMktStoreForTests() {
  campaigns = clone(initialCampaigns);
  strategies = clone(initialStrategies);
  calendar = clone(initialCalendar);
  analytics = clone(initialAnalytics);
}

resetMktStoreForTests();

export function getMktTestCompanyIds() {
  return { alpha: COMPANY_ALPHA, beta: COMPANY_BETA, user: USER_SYSTEM };
}

export function contextFromHeaders(headers: Headers): MktRequestContext | Response {
  const userId = headers.get('x-user-id');
  const companyId = headers.get('x-company-id') ?? headers.get('x-workspace-id') ?? headers.get('x-empresa-id');
  const moduleSource = headers.get('x-module-source') ?? 'fbr-portal';

  if (!userId || !companyId) {
    return Response.json({ code: 'UNAUTHORIZED_CONTEXT', message: 'X-User-Id and company headers are required.' }, { status: 401 });
  }

  const companyCheck = z.string().uuid().safeParse(companyId);
  if (!companyCheck.success) {
    return Response.json({ code: 'INVALID_COMPANY', message: 'Company header must be a valid UUID.' }, { status: 422 });
  }

  return { userId, companyId, moduleSource };
}

export function parseCampaignsQuery(url: string): CampaignsQuery {
  const params = new URL(url).searchParams;
  const rawStatus = params.getAll('status').flatMap((item) => item.split(',')).filter(Boolean);
  const rawTipo = params.getAll('tipo').flatMap((item) => item.split(',')).filter(Boolean);

  try {
    return CampaignsQuerySchema.parse({
      status: rawStatus.length > 0 ? rawStatus : undefined,
      tipo: rawTipo.length > 0 ? rawTipo : undefined,
      canal: params.get('canal') ?? undefined,
      page: params.get('page') ?? undefined,
      page_size: params.get('page_size') ?? undefined,
      sort_by: params.get('sort_by') ?? undefined,
      sort_dir: params.get('sort_dir') ?? undefined,
    });
  } catch (error) {
    if (error instanceof z.ZodError) throw normalizeZodError(error);
    throw error;
  }
}

export function listCampaigns(context: MktRequestContext, query: Partial<CampaignsQuery> = {}) {
  const parsed = CampaignsQuerySchema.parse(query);

  const filtered = campaigns.filter((campaign) => {
    if (campaign.company_id !== context.companyId) return false;
    if (parsed.status && !parsed.status.includes(campaign.status)) return false;
    if (parsed.tipo && !parsed.tipo.includes(campaign.tipo)) return false;
    if (parsed.canal && !campaign.canal.toLowerCase().includes(parsed.canal.toLowerCase())) return false;
    return true;
  });

  filtered.sort((left, right) => {
    const direction = parsed.sort_dir === 'asc' ? 1 : -1;
    const leftValue = left[parsed.sort_by];
    const rightValue = right[parsed.sort_by];
    return leftValue > rightValue ? direction : leftValue < rightValue ? -direction : 0;
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

export function createCampaign(context: MktRequestContext, data: unknown) {
  const input = parseJsonObject(data);

  try {
    const validated = CampaignSchema.parse({
      ...input,
      company_id: context.companyId,
      created_at: now(),
      id: crypto.randomUUID(),
    });

    campaigns.push(validated);
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) throw normalizeZodError(error);
    throw error;
  }
}

export function listStrategies(context: MktRequestContext): Strategy[] {
  return strategies.filter((s) => s.company_id === context.companyId);
}

export function listCalendar(context: MktRequestContext, month?: string): ContentCalendar[] {
  return calendar.filter((item) => {
    if (item.company_id !== context.companyId) return false;
    if (month && !item.data.startsWith(month)) return false;
    return true;
  });
}

export function listAnalytics(context: MktRequestContext): AnalyticsSnapshot[] {
  return analytics.filter((a) => a.company_id === context.companyId);
}

export function getDashboardKpis(context: MktRequestContext): MktDashboardKpis {
  const companyCampaigns = campaigns.filter((c) => c.company_id === context.companyId);
  const companyAnalytics = analytics.filter((a) => a.company_id === context.companyId);
  const activeCampaigns = companyCampaigns.filter((c) => c.status === 'ativa');

  const budgetTotal = companyCampaigns.reduce((sum, c) => sum + c.budget, 0);
  const budgetGasto = companyCampaigns.reduce((sum, c) => sum + c.gasto, 0);
  const roiMedio = activeCampaigns.length > 0
    ? Number((activeCampaigns.reduce((sum, c) => sum + c.roi, 0) / activeCampaigns.length).toFixed(2))
    : 0;

  const latestAnalytics = companyAnalytics.length > 0
    ? companyAnalytics[companyAnalytics.length - 1]
    : null;

  const totalImpressions = companyAnalytics.reduce((sum, a) => sum + a.impressions, 0);
  const totalClicks = companyAnalytics.reduce((sum, a) => sum + a.clicks, 0);
  const totalConversions = companyAnalytics.reduce((sum, a) => sum + a.conversions, 0);
  const ctrMedio = totalImpressions > 0 ? Number(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0;
  const cacMedio = latestAnalytics?.cac ?? 0;
  const ltvMedio = latestAnalytics?.ltv ?? 0;
  const totalLeads = totalConversions;

  const statusMap = new Map<string, number>();
  for (const c of companyCampaigns) statusMap.set(c.status, (statusMap.get(c.status) ?? 0) + 1);

  const canalMap = new Map<string, number>();
  for (const c of companyCampaigns) canalMap.set(c.canal, (canalMap.get(c.canal) ?? 0) + 1);

  const evolucao6m = companyAnalytics.slice(-6).map((a) => ({
    mes: a.periodo,
    impressoes: a.impressions,
    cliques: a.clicks,
    conversoes: a.conversions,
    gasto: companyCampaigns
      .filter((c) => c.data_inicio.slice(0, 7) <= a.periodo && (c.data_fim ?? '9999-12') >= a.periodo)
      .reduce((sum, c) => sum + c.gasto, 0),
  }));

  return {
    campanhas_ativas: activeCampaigns.length,
    total_leads: totalLeads,
    cac_medio: cacMedio,
    ltv_medio: ltvMedio,
    roi_medio: roiMedio,
    budget_total: budgetTotal,
    budget_gasto: budgetGasto,
    impressoes_total: totalImpressions,
    cliques_total: totalClicks,
    ctr_medio: ctrMedio,
    conversoes_total: totalConversions,
    campanhas_por_status: [...statusMap].map(([name, value]) => ({ name, value })),
    campanhas_por_canal: [...canalMap].map(([name, value]) => ({ name, value })),
    evolucao_6m: evolucao6m,
  };
}
