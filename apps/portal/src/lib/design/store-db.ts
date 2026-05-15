import { createSupabaseServerClient } from '../supabase-admin';

export interface DesignRequestContext {
  companyId: string;
  userId: string;
  moduleSource: string;
}

export function contextFromHeaders(headers: Headers, fallbackModuleSource = 'design'): DesignRequestContext | Response {
  const userId = headers.get('x-user-id');
  const companyId = headers.get('x-company-id') ?? headers.get('x-workspace-id') ?? headers.get('x-empresa-id');
  const moduleSource = headers.get('x-module-source') ?? fallbackModuleSource;

  if (!userId || !companyId) {
    return Response.json({ code: 'UNAUTHORIZED_CONTEXT', message: 'X-User-Id and company headers are required.' }, { status: 401 });
  }

  return { userId, companyId, moduleSource };
}

function now() {
  return new Date().toISOString();
}

export async function listBrandKitsDb(context: DesignRequestContext) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from('design_brand_kits').select('*').eq('empresa_id', context.companyId).order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getBrandKitDb(context: DesignRequestContext, kitId: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from('design_brand_kits').select('*').eq('id', kitId).eq('empresa_id', context.companyId).single();
  if (error || !data) throw new Error('Brand kit not found');
  return data;
}

export async function createBrandKitDb(context: DesignRequestContext, data: unknown) {
  const supabase = createSupabaseServerClient();
  const kit = { empresa_id: context.companyId, ...(data as object), created_at: now(), updated_at: now() };
  const { data: created, error } = await supabase.from('design_brand_kits').insert(kit).select().single();
  if (error) throw new Error(error.message);
  return created;
}

export async function updateBrandKitDb(context: DesignRequestContext, kitId: string, data: unknown) {
  const supabase = createSupabaseServerClient();
  const { data: updated, error } = await supabase.from('design_brand_kits').update({ ...(data as object), updated_at: now() }).eq('id', kitId).eq('empresa_id', context.companyId).select().single();
  if (error || !updated) throw new Error('Brand kit not found');
  return updated;
}

export async function listJobsDb(context: DesignRequestContext) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from('design_jobs').select('*').eq('empresa_id', context.companyId).order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getJobDb(context: DesignRequestContext, jobId: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from('design_jobs').select('*').eq('id', jobId).eq('empresa_id', context.companyId).single();
  if (error || !data) throw new Error('Job not found');
  return data;
}

export async function createJobDb(context: DesignRequestContext, data: unknown) {
  const supabase = createSupabaseServerClient();
  const job = { empresa_id: context.companyId, status: 'pendente', ...(data as object), created_at: now(), updated_at: now() };
  const { data: created, error } = await supabase.from('design_jobs').insert(job).select().single();
  if (error) throw new Error(error.message);
  return created;
}

export async function updateJobStatusDb(context: DesignRequestContext, jobId: string, status: string) {
  const supabase = createSupabaseServerClient();
  const { data: updated, error } = await supabase.from('design_jobs').update({ status, updated_at: now() }).eq('id', jobId).eq('empresa_id', context.companyId).select().single();
  if (error || !updated) throw new Error('Job not found');
  return updated;
}

export async function reviewJobDb(context: DesignRequestContext, jobId: string, approved: boolean, feedback?: string) {
  const supabase = createSupabaseServerClient();
  const { data: updated, error } = await supabase.from('design_jobs').update({ 
    review_status: approved ? 'aprovado' : 'rejeitado',
    review_feedback: feedback,
    reviewed_by: context.userId,
    reviewed_at: now(),
    updated_at: now(),
  }).eq('id', jobId).eq('empresa_id', context.companyId).select().single();
  if (error) throw new Error(error.message);
  return updated;
}

export async function listTemplatesDb(context: DesignRequestContext) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from('design_templates').select('*').eq('empresa_id', context.companyId);
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getDashboardDb(context: DesignRequestContext) {
  const supabase = createSupabaseServerClient();
  const { count: totalJobs } = await supabase.from('design_jobs').select('*', { count: 'exact', head: true }).eq('empresa_id', context.companyId);
  const { count: emProgresso } = await supabase.from('design_jobs').select('*', { count: 'exact', head: true }).eq('empresa_id', context.companyId).in('status', ['processando', 'renderizando']);
  const { count: concluidos } = await supabase.from('design_jobs').select('*', { count: 'exact', head: true }).eq('empresa_id', context.companyId).eq('status', 'concluido');
  return { total_jobs: totalJobs || 0, em_progresso: emProgresso || 0, concluidos: concluidos || 0 };
}