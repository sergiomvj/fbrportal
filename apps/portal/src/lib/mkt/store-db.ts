import { z } from 'zod';
import { createSupabaseServerClient } from '../supabase-admin';
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
  // DB is persistent, no-op for now unless we need to truncate tables
}

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

export async function createEstrategia(context: MktRequestContext, data: unknown): Promise<MktEstrategia> {
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

  const supabase = createSupabaseServerClient();
  const { data: est, error } = await supabase.from('mkt_estrategias').insert(validated).select().single();
  
  if (error) throw new Error(error.message);
  return est as MktEstrategia;
}

export async function listEstrategias(context: MktRequestContext, query: Partial<MktEstrategiasQuery> = {}) {
  const parsed = MktEstrategiasQuerySchema.parse(query);
  const supabase = createSupabaseServerClient();

  let q = supabase.from('mkt_estrategias').select('*', { count: 'exact' }).eq('empresa_id', context.companyId);

  if (parsed.status && parsed.status.length > 0) {
    q = q.in('status', parsed.status);
  }

  q = q.order(parsed.sort_by, { ascending: parsed.sort_dir === 'asc' });

  const start = (parsed.page - 1) * parsed.page_size;
  q = q.range(start, start + parsed.page_size - 1);

  const { data, error, count } = await q;

  if (error) throw new Error(error.message);

  return {
    items: data as MktEstrategia[],
    pagination: {
      page: parsed.page,
      page_size: parsed.page_size,
      total: count || 0,
      total_pages: Math.ceil((count || 0) / parsed.page_size),
    },
  };
}

export async function getEstrategia(estrategiaId: string, context: MktRequestContext): Promise<MktEstrategia> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from('mkt_estrategias').select('*').eq('id', estrategiaId).eq('empresa_id', context.companyId).single();
  if (error || !data) throw new Error('Estrategia not found');
  return data as MktEstrategia;
}

export async function updateEstrategiaStatus(estrategiaId: string, status: MktEstrategiaStatus, context: MktRequestContext): Promise<MktEstrategia> {
  await getEstrategia(estrategiaId, context);
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from('mkt_estrategias').update({ status, updated_at: now() }).eq('id', estrategiaId).select().single();
  if (error || !data) throw new Error('Failed to update estrategia');
  return data as MktEstrategia;
}

export async function saveDiagnostico(diagnostico: Omit<MktDiagnostico, 'id' | 'created_at'>): Promise<MktDiagnostico> {
  const supabase = createSupabaseServerClient();
  const { data: existing } = await supabase.from('mkt_diagnosticos').select('*').eq('estrategia_id', diagnostico.estrategia_id).maybeSingle();
  
  if (existing) {
    const { data, error } = await supabase.from('mkt_diagnosticos').update(diagnostico).eq('id', existing.id).select().single();
    if (error) throw new Error(error.message);
    return data as MktDiagnostico;
  }
  
  const full = { ...diagnostico, id: crypto.randomUUID(), created_at: now() };
  const { data, error } = await supabase.from('mkt_diagnosticos').insert(full).select().single();
  if (error) throw new Error(error.message);
  return data as MktDiagnostico;
}

export async function getDiagnosticoByEstrategia(estrategiaId: string, context: MktRequestContext): Promise<MktDiagnostico | null> {
  await getEstrategia(estrategiaId, context);
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.from('mkt_diagnosticos').select('*').eq('estrategia_id', estrategiaId).maybeSingle();
  return (data as MktDiagnostico) || null;
}

export async function approveDiagnostico(estrategiaId: string, userId: string, context: MktRequestContext): Promise<MktDiagnostico> {
  await getEstrategia(estrategiaId, context);
  const supabase = createSupabaseServerClient();
  const { data: diag } = await supabase.from('mkt_diagnosticos').select('*').eq('estrategia_id', estrategiaId).maybeSingle();
  if (!diag) throw new Error('Diagnostico not found');
  
  const { data, error } = await supabase.from('mkt_diagnosticos').update({
    aprovado: true,
    aprovado_por: userId,
    aprovado_em: now()
  }).eq('id', diag.id).select().single();
  
  if (error) throw new Error(error.message);
  return data as MktDiagnostico;
}

export async function saveVersao(versao: Omit<MktEstrategiaVersao, 'id' | 'created_at'>): Promise<MktEstrategiaVersao> {
  const supabase = createSupabaseServerClient();
  const full = { ...versao, id: crypto.randomUUID(), created_at: now() };
  
  const { data, error } = await supabase.from('mkt_estrategia_versoes').insert(full).select().single();
  if (error) throw new Error(error.message);
  
  await supabase.from('mkt_estrategias').update({ versao: versao.versao, status: 'ativa', updated_at: now() }).eq('id', versao.estrategia_id);
  
  return data as MktEstrategiaVersao;
}

export async function listVersoes(estrategiaId: string, context: MktRequestContext): Promise<MktEstrategiaVersao[]> {
  await getEstrategia(estrategiaId, context);
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.from('mkt_estrategia_versoes').select('*').eq('estrategia_id', estrategiaId).order('versao', { ascending: false });
  return (data as MktEstrategiaVersao[]) || [];
}

export async function getVersao(estrategiaId: string, versao: number, context: MktRequestContext): Promise<MktEstrategiaVersao> {
  await getEstrategia(estrategiaId, context);
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from('mkt_estrategia_versoes').select('*').eq('estrategia_id', estrategiaId).eq('versao', versao).single();
  if (error || !data) throw new Error('Versao not found');
  return data as MktEstrategiaVersao;
}

export async function saveCopyVariants(variants: Omit<MktCopyVariant, 'id' | 'created_at'>[]): Promise<MktCopyVariant[]> {
  if (variants.length === 0) return [];
  const supabase = createSupabaseServerClient();
  const inserts = variants.map(v => ({ ...v, id: crypto.randomUUID(), created_at: now() }));
  const { data, error } = await supabase.from('mkt_copywriting_variants').insert(inserts).select();
  if (error) throw new Error(error.message);
  return data as MktCopyVariant[];
}

export async function listCopyByEstrategia(estrategiaId: string, context: MktRequestContext): Promise<MktCopyVariant[]> {
  await getEstrategia(estrategiaId, context);
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.from('mkt_copywriting_variants').select('*').eq('estrategia_id', estrategiaId);
  return (data as MktCopyVariant[]) || [];
}

export async function saveLeadMagnets(magnets: Omit<MktLeadMagnet, 'id' | 'created_at'>[]): Promise<MktLeadMagnet[]> {
  if (magnets.length === 0) return [];
  const supabase = createSupabaseServerClient();
  const inserts = magnets.map(v => ({ ...v, id: crypto.randomUUID(), created_at: now() }));
  const { data, error } = await supabase.from('mkt_lead_magnets').insert(inserts).select();
  if (error) throw new Error(error.message);
  return data as MktLeadMagnet[];
}

export async function listLeadMagnetsByEstrategia(estrategiaId: string, context: MktRequestContext): Promise<MktLeadMagnet[]> {
  await getEstrategia(estrategiaId, context);
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.from('mkt_lead_magnets').select('*').eq('estrategia_id', estrategiaId);
  return (data as MktLeadMagnet[]) || [];
}

export async function saveCalendarItems(items: Omit<MktCalendarItem, 'id' | 'created_at'>[]): Promise<MktCalendarItem[]> {
  if (items.length === 0) return [];
  const supabase = createSupabaseServerClient();
  const inserts = items.map(v => ({ ...v, id: crypto.randomUUID(), created_at: now() }));
  const { data, error } = await supabase.from('mkt_calendar_items').insert(inserts).select();
  if (error) throw new Error(error.message);
  return data as MktCalendarItem[];
}

export async function listCalendarByEstrategia(estrategiaId: string, context: MktRequestContext): Promise<MktCalendarItem[]> {
  await getEstrategia(estrategiaId, context);
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.from('mkt_calendar_items').select('*').eq('estrategia_id', estrategiaId).order('data', { ascending: true });
  return (data as MktCalendarItem[]) || [];
}

export async function saveRoadmapTasks(tasks: Omit<MktRoadmapTask, 'id' | 'created_at'>[]): Promise<MktRoadmapTask[]> {
  if (tasks.length === 0) return [];
  const supabase = createSupabaseServerClient();
  const inserts = tasks.map(v => ({ ...v, id: crypto.randomUUID(), created_at: now() }));
  const { data, error } = await supabase.from('mkt_roadmap_tasks').insert(inserts).select();
  if (error) throw new Error(error.message);
  return data as MktRoadmapTask[];
}

export async function listRoadmapByEstrategia(estrategiaId: string, context: MktRequestContext): Promise<MktRoadmapTask[]> {
  await getEstrategia(estrategiaId, context);
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.from('mkt_roadmap_tasks').select('*').eq('estrategia_id', estrategiaId);
  return (data as MktRoadmapTask[]) || [];
}

export async function saveChatMessage(msg: Omit<MktChatMessage, 'id' | 'created_at'>): Promise<MktChatMessage> {
  const supabase = createSupabaseServerClient();
  const full = { ...msg, id: crypto.randomUUID(), created_at: now() };
  const { data, error } = await supabase.from('mkt_chat_messages').insert(full).select().single();
  if (error) throw new Error(error.message);
  return data as MktChatMessage;
}

export async function listChatByEstrategia(estrategiaId: string, context: MktRequestContext, limit = 50): Promise<MktChatMessage[]> {
  await getEstrategia(estrategiaId, context);
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.from('mkt_chat_messages').select('*').eq('estrategia_id', estrategiaId).order('created_at', { ascending: true }).limit(limit);
  return (data as MktChatMessage[]) || [];
}

export async function saveExport(exp: Omit<MktExport, 'id' | 'created_at'>): Promise<MktExport> {
  const supabase = createSupabaseServerClient();
  const full = { ...exp, id: crypto.randomUUID(), created_at: now() };
  const { data, error } = await supabase.from('mkt_exports').insert(full).select().single();
  if (error) throw new Error(error.message);
  return data as MktExport;
}

export async function listExportsByEstrategia(estrategiaId: string, context: MktRequestContext): Promise<MktExport[]> {
  await getEstrategia(estrategiaId, context);
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.from('mkt_exports').select('*').eq('estrategia_id', estrategiaId);
  return (data as MktExport[]) || [];
}

export async function getAgentsByEmpresa(context: MktRequestContext): Promise<MktAgent[]> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.from('mkt_agents').select('*').eq('empresa_id', context.companyId);
  return (data as MktAgent[]) || [];
}

export async function saveAgentActionLog(log: Omit<MktAgentActionLog, 'id' | 'created_at'>): Promise<MktAgentActionLog> {
  const supabase = createSupabaseServerClient();
  const full = { ...log, id: crypto.randomUUID(), created_at: now() };
  const { data, error } = await supabase.from('mkt_agent_action_logs').insert(full).select().single();
  if (error) throw new Error(error.message);
  return data as MktAgentActionLog;
}

export async function listAgentLogs(context: MktRequestContext, limit = 50): Promise<MktAgentActionLog[]> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.from('mkt_agent_action_logs').select('*').eq('empresa_id', context.companyId).order('created_at', { ascending: false }).limit(limit);
  return (data as MktAgentActionLog[]) || [];
}

export async function saveProcessingJob(job: Omit<MktProcessingJob, 'id' | 'created_at' | 'updated_at'>): Promise<MktProcessingJob> {
  const supabase = createSupabaseServerClient();
  const full = { ...job, id: crypto.randomUUID(), created_at: now(), updated_at: now() };
  const { data, error } = await supabase.from('mkt_processing_jobs').insert(full).select().single();
  if (error) throw new Error(error.message);
  return data as MktProcessingJob;
}

export async function getBranding(context: MktRequestContext): Promise<MktBranding | null> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.from('mkt_branding').select('*').eq('empresa_id', context.companyId).maybeSingle();
  return (data as MktBranding) || null;
}

export async function getDashboardKpis(context: MktRequestContext): Promise<MktDashboardKpis> {
  const supabase = createSupabaseServerClient();
  
  const { count: ativas } = await supabase.from('mkt_estrategias').select('*', { count: 'exact', head: true }).eq('empresa_id', context.companyId).eq('status', 'ativa');
  const { count: processando } = await supabase.from('mkt_estrategias').select('*', { count: 'exact', head: true }).eq('empresa_id', context.companyId).eq('status', 'processando');
  
  const { data: diags } = await supabase.from('mkt_diagnosticos').select('aprovado, mkt_estrategias!inner(empresa_id)').eq('mkt_estrategias.empresa_id', context.companyId);
  const aprovados = diags?.filter(d => d.aprovado).length || 0;
  const total_diags = diags?.length || 0;
  
  const { count: exports } = await supabase.from('mkt_exports').select('mkt_estrategias!inner(empresa_id)', { count: 'exact', head: true }).eq('mkt_estrategias.empresa_id', context.companyId);
  
  const { count: jobsFalha } = await supabase.from('mkt_processing_jobs').select('*', { count: 'exact', head: true }).eq('empresa_id', context.companyId).eq('status', 'failed');
  const { count: agentes } = await supabase.from('mkt_agents').select('*', { count: 'exact', head: true }).eq('empresa_id', context.companyId).eq('ativo', true);

  const taxaAprovacao = total_diags > 0 ? (aprovados / total_diags) * 100 : 0;

  return {
    estrategias_ativas: ativas || 0,
    estrategias_processando: processando || 0,
    total_diagnosticos: total_diags,
    total_exportacoes: exports || 0,
    taxa_aprovacao: Number(taxaAprovacao.toFixed(1)),
    tempo_medio_geracao: 45,
    agentes_ativos: agentes || 0,
    jobs_falha: jobsFalha || 0,
  };
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

export async function listCampaigns(context: MktRequestContext, query: Partial<CampaignsQuery> = {}) {
  return { items: [], pagination: { page: 1, page_size: 10, total: 0, total_pages: 0 } };
}

export async function createCampaign(context: MktRequestContext, data: unknown) {
  throw new Error('Not implemented');
}
