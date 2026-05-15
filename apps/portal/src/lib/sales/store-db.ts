import { createSupabaseServerClient } from '../supabase-admin';

export interface SalesRequestContext {
  companyId: string;
  userId: string;
  moduleSource: string;
}

export function contextFromHeaders(headers: Headers, fallbackModuleSource = 'sales'): SalesRequestContext | Response {
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

export async function listPartnersDb(context: SalesRequestContext) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from('sales_partners').select('*').eq('company_id', context.companyId);
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getPartnerDb(context: SalesRequestContext, partnerId: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from('sales_partners').select('*').eq('id', partnerId).eq('company_id', context.companyId).single();
  if (error || !data) throw new Error('Partner not found');
  return data;
}

export async function createPartnerDb(context: SalesRequestContext, data: unknown) {
  const supabase = createSupabaseServerClient();
  const partner = {
    company_id: context.companyId,
    owner_id: context.userId,
    created_by: context.userId,
    ...(data as object),
    created_at: now(),
  };
  const { data: created, error } = await supabase.from('sales_partners').insert(partner).select().single();
  if (error) throw new Error(error.message);
  return created;
}

export async function updatePartnerDb(context: SalesRequestContext, partnerId: string, data: unknown) {
  const supabase = createSupabaseServerClient();
  const { data: updated, error } = await supabase.from('sales_partners').update(data as object).eq('id', partnerId).eq('company_id', context.companyId).select().single();
  if (error || !updated) throw new Error('Partner not found');
  return updated;
}

export async function transitionPartnerDb(context: SalesRequestContext, partnerId: string, newStage: string) {
  const partner = await getPartnerDb(context, partnerId);
  const supabase = createSupabaseServerClient();
  
  const { data: updated, error } = await supabase.from('sales_partners').update({ estagio: newStage, updated_at: now() }).eq('id', partnerId).select().single();
  if (error) throw new Error(error.message);
  
  await appendPartnerEventDb(context, partnerId, 'stage_change', { from: partner.estagio, to: newStage });
  return updated;
}

export async function appendPartnerEventDb(context: SalesRequestContext, partnerId: string, eventType: string, metadata?: object) {
  const supabase = createSupabaseServerClient();
  const event = {
    partner_id: partnerId,
    company_id: context.companyId,
    event_type: eventType,
    actor_id: context.userId,
    metadata: metadata || {},
    created_at: now(),
  };
  const { data: created, error } = await supabase.from('sales_partner_events').insert(event).select().single();
  if (error) throw new Error(error.message);
  return created;
}

export async function listReceitasDb(context: SalesRequestContext, filters?: { status?: string; parceiro_id?: string }) {
  const supabase = createSupabaseServerClient();
  let query = supabase.from('sales_receitas').select('*').eq('company_id', context.companyId);
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.parceiro_id) query = query.eq('parceiro_id', filters.parceiro_id);
  const { data, error } = await query.order('data_recebimento', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function createReceitaDb(context: SalesRequestContext, data: unknown) {
  const supabase = createSupabaseServerClient();
  const receita = {
    company_id: context.companyId,
    ...(data as object),
    created_at: now(),
  };
  const { data: created, error } = await supabase.from('sales_receitas').insert(receita).select().single();
  if (error) throw new Error(error.message);
  return created;
}

export async function listMediaKitsDb(context: SalesRequestContext) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from('sales_media_kits').select('*').eq('company_id', context.companyId).order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function createMediaKitDb(context: SalesRequestContext, data: unknown) {
  const supabase = createSupabaseServerClient();
  const mediaKit = {
    company_id: context.companyId,
    status: 'gerando',
    ...(data as object),
    created_at: now(),
  };
  const { data: created, error } = await supabase.from('sales_media_kits').insert(mediaKit).select().single();
  if (error) throw new Error(error.message);
  return created;
}

export async function getDashboardKpisDb(context: SalesRequestContext) {
  const supabase = createSupabaseServerClient();
  
  const { count: totalPartners } = await supabase.from('sales_partners').select('*', { count: 'exact', head: true }).eq('company_id', context.companyId);
  const { count: activePartners } = await supabase.from('sales_partners').select('*', { count: 'exact', head: true }).eq('company_id', context.companyId).eq('estagio', 'active');
  const { data: receitas } = await supabase.from('sales_receitas').select('valor').eq('company_id', context.companyId).eq('status', 'reconciliado');
  const totalRevenue = receitas?.reduce((sum, r) => sum + (r.valor || 0), 0) || 0;
  
  return { total_partners: totalPartners || 0, active_partners: activePartners || 0, total_revenue: totalRevenue };
}