import { z } from 'zod';
import type {
  MktEstrategia,
  MktDiagnostico,
  MktEstrategiaVersao,
  MktCopyVariant,
  MktLeadMagnet,
  MktCalendarItem,
  MktRoadmapTask,
  MktChatMessage,
  MktExport,
  MktAgent,
  MktAgentActionLog,
  MktProcessingJob,
  MktBranding,
  MktDashboardKpis,
  MktEstrategiasQuery,
  MktEstrategiaStatus,
  Campaign,
  CampaignsQuery,
} from './types';
import {
  MktEstrategiaSchema,
  MktEstrategiasQuerySchema,
  CampaignSchema,
  CampaignsQuerySchema,
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

let estrategias: MktEstrategia[] = [];
let diagnosticos: MktDiagnostico[] = [];
let versoes: MktEstrategiaVersao[] = [];
let copyVariants: MktCopyVariant[] = [];
let leadMagnets: MktLeadMagnet[] = [];
let calendarItems: MktCalendarItem[] = [];
let roadmapTasks: MktRoadmapTask[] = [];
let chatMessages: MktChatMessage[] = [];
let exportsList: MktExport[] = [];
let agents: MktAgent[] = [];
let agentLogs: MktAgentActionLog[] = [];
let processingJobs: MktProcessingJob[] = [];
let brandings: MktBranding[] = [];

const defaultBranding: MktBranding[] = [
  {
    empresa_id: COMPANY_ALPHA,
    cor_primaria: '#0EA5E9',
    cor_secundaria: '#8B5CF6',
    fonte_principal: 'Inter',
    nome_empresa: 'Facebrasil Alpha',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const defaultAgents: MktAgent[] = [
  { empresa_id: COMPANY_ALPHA, slot: 'extrator', nome: 'Extrator Bot', descricao: 'Extrai SWOT, persona, UVP do documento', ativo: true },
  { empresa_id: COMPANY_ALPHA, slot: 'estrategista', nome: 'Estrategista Bot', descricao: 'Gera posicionamento, canal mix, KPIs', ativo: true },
  { empresa_id: COMPANY_ALPHA, slot: 'redator', nome: 'Redator Bot', descricao: 'Headlines, CTAs, copy, landing pages', ativo: true },
  { empresa_id: COMPANY_ALPHA, slot: 'calendario', nome: 'Calendario Bot', descricao: 'Propoe grade editorial 90 dias', ativo: true },
  { empresa_id: COMPANY_ALPHA, slot: 'exportador', nome: 'Exportador Bot', descricao: 'Gera PDF executivo e PPTX', ativo: true },
  { empresa_id: COMPANY_ALPHA, slot: 'onboarding', nome: 'Onboarding Bot', descricao: 'Guia o usuario na primeira estrategia', ativo: true },
];

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
  estrategias = [];
  diagnosticos = [];
  versoes = [];
  copyVariants = [];
  leadMagnets = [];
  calendarItems = [];
  roadmapTasks = [];
  chatMessages = [];
  exportsList = [];
  agents = clone(defaultAgents);
  agentLogs = [];
  processingJobs = [];
  brandings = clone(defaultBranding);
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

export function parseEstrategiasQuery(url: string): MktEstrategiasQuery {
  const params = new URL(url).searchParams;
  const rawStatus = params.getAll('status').flatMap((item) => item.split(',')).filter(Boolean);

  try {
    return MktEstrategiasQuerySchema.parse({
      status: rawStatus.length > 0 ? rawStatus : undefined,
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

export function createEstrategia(context: MktRequestContext, data: unknown): MktEstrategia {
  const input = parseJsonObject(data);
  const validated = MktEstrategiaSchema.parse({
    ...input,
    id: crypto.randomUUID(),
    user_id: context.userId,
    empresa_id: context.companyId,
    versao: 0,
    status: 'processando',
    created_at: now(),
    updated_at: now(),
  });
  estrategias.push(validated);
  return validated;
}

export function listEstrategias(context: MktRequestContext, query: Partial<MktEstrategiasQuery> = {}) {
  const parsed = MktEstrategiasQuerySchema.parse(query);
  const filtered = estrategias.filter((e) => {
    if (e.empresa_id !== context.companyId) return false;
    if (parsed.status && !parsed.status.includes(e.status)) return false;
    return true;
  });

  filtered.sort((a, b) => {
    const dir = parsed.sort_dir === 'asc' ? 1 : -1;
    const av = a[parsed.sort_by] ?? '';
    const bv = b[parsed.sort_by] ?? '';
    return av > bv ? dir : av < bv ? -dir : 0;
  });

  const start = (parsed.page - 1) * parsed.page_size;
  return {
    items: filtered.slice(start, start + parsed.page_size),
    pagination: {
      page: parsed.page,
      page_size: parsed.page_size,
      total: filtered.length,
      total_pages: Math.ceil(filtered.length / parsed.page_size),
    },
  };
}

export function getEstrategia(estrategiaId: string, context: MktRequestContext): MktEstrategia {
  const e = estrategias.find((s) => s.id === estrategiaId && s.empresa_id === context.companyId);
  if (!e) throw new Error('Estrategia not found');
  return e;
}

export function updateEstrategiaStatus(estrategiaId: string, status: MktEstrategiaStatus, context: MktRequestContext): MktEstrategia {
  const e = getEstrategia(estrategiaId, context);
  e.status = status;
  e.updated_at = now();
  return e;
}

export function saveDiagnostico(diagnostico: Omit<MktDiagnostico, 'id' | 'created_at'>): MktDiagnostico {
  const existing = diagnosticos.find((d) => d.estrategia_id === diagnostico.estrategia_id);
  if (existing) {
    Object.assign(existing, diagnostico);
    return existing;
  }
  const full: MktDiagnostico = { ...diagnostico, id: crypto.randomUUID(), created_at: now() };
  diagnosticos.push(full);
  return full;
}

export function getDiagnosticoByEstrategia(estrategiaId: string, context: MktRequestContext): MktDiagnostico | null {
  getEstrategia(estrategiaId, context);
  return diagnosticos.find((d) => d.estrategia_id === estrategiaId) ?? null;
}

export function approveDiagnostico(estrategiaId: string, userId: string, context: MktRequestContext): MktDiagnostico {
  const diag = diagnosticos.find((d) => d.estrategia_id === estrategiaId);
  if (!diag) throw new Error('Diagnostico not found');
  getEstrategia(estrategiaId, context);
  diag.aprovado = true;
  diag.aprovado_por = userId;
  diag.aprovado_em = now();
  return diag;
}

export function saveVersao(versao: Omit<MktEstrategiaVersao, 'id' | 'created_at'>): MktEstrategiaVersao {
  const full: MktEstrategiaVersao = { ...versao, id: crypto.randomUUID(), created_at: now() };
  versoes.push(full);
  const e = estrategias.find((s) => s.id === versao.estrategia_id);
  if (e) {
    e.versao = versao.versao;
    e.status = 'ativa';
    e.updated_at = now();
  }
  return full;
}

export function listVersoes(estrategiaId: string, context: MktRequestContext): MktEstrategiaVersao[] {
  getEstrategia(estrategiaId, context);
  return versoes.filter((v) => v.estrategia_id === estrategiaId).sort((a, b) => b.versao - a.versao);
}

export function getVersao(estrategiaId: string, versao: number, context: MktRequestContext): MktEstrategiaVersao {
  getEstrategia(estrategiaId, context);
  const v = versoes.find((vv) => vv.estrategia_id === estrategiaId && vv.versao === versao);
  if (!v) throw new Error('Versao not found');
  return v;
}

export function saveCopyVariants(variants: Omit<MktCopyVariant, 'id' | 'created_at'>[]): MktCopyVariant[] {
  const results: MktCopyVariant[] = [];
  for (const v of variants) {
    const full: MktCopyVariant = { ...v, id: crypto.randomUUID(), created_at: now() };
    copyVariants.push(full);
    results.push(full);
  }
  return results;
}

export function listCopyByEstrategia(estrategiaId: string, context: MktRequestContext): MktCopyVariant[] {
  getEstrategia(estrategiaId, context);
  return copyVariants.filter((c) => c.estrategia_id === estrategiaId);
}

export function saveLeadMagnets(magnets: Omit<MktLeadMagnet, 'id' | 'created_at'>[]): MktLeadMagnet[] {
  const results: MktLeadMagnet[] = [];
  for (const m of magnets) {
    const full: MktLeadMagnet = { ...m, id: crypto.randomUUID(), created_at: now() };
    leadMagnets.push(full);
    results.push(full);
  }
  return results;
}

export function listLeadMagnetsByEstrategia(estrategiaId: string, context: MktRequestContext): MktLeadMagnet[] {
  getEstrategia(estrategiaId, context);
  return leadMagnets.filter((l) => l.estrategia_id === estrategiaId);
}

export function saveCalendarItems(items: Omit<MktCalendarItem, 'id' | 'created_at'>[]): MktCalendarItem[] {
  const results: MktCalendarItem[] = [];
  for (const item of items) {
    const full: MktCalendarItem = { ...item, id: crypto.randomUUID(), created_at: now() };
    calendarItems.push(full);
    results.push(full);
  }
  return results;
}

export function listCalendarByEstrategia(estrategiaId: string, context: MktRequestContext): MktCalendarItem[] {
  getEstrategia(estrategiaId, context);
  return calendarItems.filter((c) => c.estrategia_id === estrategiaId).sort((a, b) => a.data.localeCompare(b.data));
}

export function saveRoadmapTasks(tasks: Omit<MktRoadmapTask, 'id' | 'created_at'>[]): MktRoadmapTask[] {
  const results: MktRoadmapTask[] = [];
  for (const t of tasks) {
    const full: MktRoadmapTask = { ...t, id: crypto.randomUUID(), created_at: now() };
    roadmapTasks.push(full);
    results.push(full);
  }
  return results;
}

export function listRoadmapByEstrategia(estrategiaId: string, context: MktRequestContext): MktRoadmapTask[] {
  getEstrategia(estrategiaId, context);
  return roadmapTasks.filter((r) => r.estrategia_id === estrategiaId);
}

export function saveChatMessage(msg: Omit<MktChatMessage, 'id' | 'created_at'>): MktChatMessage {
  const full: MktChatMessage = { ...msg, id: crypto.randomUUID(), created_at: now() };
  chatMessages.push(full);
  return full;
}

export function listChatByEstrategia(estrategiaId: string, context: MktRequestContext, limit = 50): MktChatMessage[] {
  getEstrategia(estrategiaId, context);
  return chatMessages
    .filter((m) => m.estrategia_id === estrategiaId)
    .sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? ''))
    .slice(-limit);
}

export function saveExport(exp: Omit<MktExport, 'id' | 'created_at'>): MktExport {
  const full: MktExport = { ...exp, id: crypto.randomUUID(), created_at: now() };
  exportsList.push(full);
  return full;
}

export function listExportsByEstrategia(estrategiaId: string, context: MktRequestContext): MktExport[] {
  getEstrategia(estrategiaId, context);
  return exportsList.filter((e) => e.estrategia_id === estrategiaId);
}

export function getAgentsByEmpresa(context: MktRequestContext): MktAgent[] {
  return agents.filter((a) => a.empresa_id === context.companyId);
}

export function saveAgentActionLog(log: Omit<MktAgentActionLog, 'id' | 'created_at'>): MktAgentActionLog {
  const full: MktAgentActionLog = { ...log, id: crypto.randomUUID(), created_at: now() };
  agentLogs.push(full);
  return full;
}

export function listAgentLogs(context: MktRequestContext, limit = 50): MktAgentActionLog[] {
  return agentLogs
    .filter((l) => l.empresa_id === context.companyId)
    .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
    .slice(0, limit);
}

export function saveProcessingJob(job: Omit<MktProcessingJob, 'id' | 'created_at' | 'updated_at'>): MktProcessingJob {
  const full: MktProcessingJob = { ...job, id: crypto.randomUUID(), created_at: now(), updated_at: now() };
  processingJobs.push(full);
  return full;
}

export function getBranding(context: MktRequestContext): MktBranding | null {
  return brandings.find((b) => b.empresa_id === context.companyId) ?? null;
}

export function getDashboardKpis(context: MktRequestContext): MktDashboardKpis {
  const companyEstrategias = estrategias.filter((e) => e.empresa_id === context.companyId);
  const companyDiags = diagnosticos.filter((d) => {
    return companyEstrategias.some((e) => e.id === d.estrategia_id);
  });
  const companyExports = exportsList.filter((ex) => {
    return companyEstrategias.some((e) => e.id === ex.estrategia_id);
  });
  const companyJobs = processingJobs.filter((j) => j.empresa_id === context.companyId);
  const companyAgents = agents.filter((a) => a.empresa_id === context.companyId && a.ativo);

  const ativas = companyEstrategias.filter((e) => e.status === 'ativa').length;
  const processando = companyEstrategias.filter((e) => e.status === 'processando').length;
  const aprovados = companyDiags.filter((d) => d.aprovado).length;
  const taxaAprovacao = companyDiags.length > 0 ? (aprovados / companyDiags.length) * 100 : 0;
  const jobsFailed = companyJobs.filter((j) => j.status === 'failed').length;

  return {
    estrategias_ativas: ativas,
    estrategias_processando: processando,
    total_diagnosticos: companyDiags.length,
    total_exportacoes: companyExports.length,
    taxa_aprovacao: Number(taxaAprovacao.toFixed(1)),
    tempo_medio_geracao: 45,
    agentes_ativos: companyAgents.length,
    jobs_falha: jobsFailed,
  };
}

// Legacy campaigns store for backward compatibility
const campaigns: Campaign[] = [];

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
  const filtered = campaigns.filter((c) => {
    if (c.company_id !== context.companyId) return false;
    if (parsed.status && !parsed.status.includes(c.status)) return false;
    if (parsed.tipo && !parsed.tipo.includes(c.tipo)) return false;
    if (parsed.canal && !c.canal.toLowerCase().includes(parsed.canal.toLowerCase())) return false;
    return true;
  });

  filtered.sort((a, b) => {
    const dir = parsed.sort_dir === 'asc' ? 1 : -1;
    const av = a[parsed.sort_by];
    const bv = b[parsed.sort_by];
    return av > bv ? dir : av < bv ? -dir : 0;
  });

  const start = (parsed.page - 1) * parsed.page_size;
  return {
    items: filtered.slice(start, start + parsed.page_size),
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
