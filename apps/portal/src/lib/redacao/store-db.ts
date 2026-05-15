import { createSupabaseServerClient } from '../supabase-admin';

export interface RedacaoRequestContext {
  companyId: string;
  userId: string;
  moduleSource: string;
}

export function contextFromHeaders(headers: Headers, fallbackModuleSource = 'redacao'): RedacaoRequestContext | Response {
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

export async function listArtigosDb(context: RedacaoRequestContext) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from('redacao_artigos').select('*').eq('empresa_id', context.companyId).order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getArtigoDb(context: RedacaoRequestContext, artigoId: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from('redacao_artigos').select('*').eq('id', artigoId).eq('empresa_id', context.companyId).single();
  if (error || !data) throw new Error('Artigo not found');
  return data;
}

export async function createArtigoDb(context: RedacaoRequestContext, data: unknown) {
  const supabase = createSupabaseServerClient();
  const artigo = {
    empresa_id: context.companyId,
    etapa: 'rascunho',
    ...(data as object),
    created_at: now(),
    updated_at: now(),
  };
  const { data: created, error } = await supabase.from('redacao_artigos').insert(artigo).select().single();
  if (error) throw new Error(error.message);
  return created;
}

export async function updateArtigoEtapaDb(context: RedacaoRequestContext, artigoId: string, etapa: string) {
  const supabase = createSupabaseServerClient();
  const { data: updated, error } = await supabase.from('redacao_artigos').update({ etapa, updated_at: now() }).eq('id', artigoId).eq('empresa_id', context.companyId).select().single();
  if (error || !updated) throw new Error('Artigo not found');
  
  await appendArtigoHistoryDb(context, artigoId, 'etapa_change', { nova_etapa: etapa });
  return updated;
}

async function appendArtigoHistoryDb(context: RedacaoRequestContext, artigoId: string, eventType: string, metadata?: object) {
  const supabase = createSupabaseServerClient();
  await supabase.from('redacao_artigo_history').insert({
    artigo_id: artigoId,
    empresa_id: context.companyId,
    event_type: eventType,
    actor_id: context.userId,
    metadata: metadata || {},
    created_at: now(),
  });
}

export async function listFontesDb(context: RedacaoRequestContext) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from('redacao_fontes').select('*').eq('empresa_id', context.companyId);
  if (error) throw new Error(error.message);
  return data || [];
}

export async function createFonteDb(context: RedacaoRequestContext, data: unknown) {
  const supabase = createSupabaseServerClient();
  const fonte = { empresa_id: context.companyId, ...(data as object), created_at: now() };
  const { data: created, error } = await supabase.from('redacao_fontes').insert(fonte).select().single();
  if (error) throw new Error(error.message);
  return created;
}

export async function toggleFonteDb(context: RedacaoRequestContext, fonteId: string, ativo: boolean) {
  const supabase = createSupabaseServerClient();
  const { data: updated, error } = await supabase.from('redacao_fontes').update({ ativo }).eq('id', fonteId).eq('empresa_id', context.companyId).select().single();
  if (error) throw new Error(error.message);
  return updated;
}

export async function listUgcDb(context: RedacaoRequestContext) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from('redacao_ugc').select('*').eq('empresa_id', context.companyId).order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function moderateUgcDb(context: RedacaoRequestContext, ugcId: string, approved: boolean) {
  const supabase = createSupabaseServerClient();
  const { data: updated, error } = await supabase.from('redacao_ugc').update({ 
    status: approved ? 'aprovado' : 'rejeitado',
    moderado_por: context.userId,
    moderado_em: now(),
  }).eq('id', ugcId).eq('empresa_id', context.companyId).select().single();
  if (error) throw new Error(error.message);
  return updated;
}

export async function listAlertasDb(context: RedacaoRequestContext) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from('redacao_alertas').select('*').eq('empresa_id', context.companyId).order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function resolveAlertaDb(context: RedacaoRequestContext, alertaId: string) {
  const supabase = createSupabaseServerClient();
  const { data: updated, error } = await supabase.from('redacao_alertas').update({ 
    resolvido: true, 
    resolvido_por: context.userId,
    resolvido_em: now(),
  }).eq('id', alertaId).eq('empresa_id', context.companyId).select().single();
  if (error) throw new Error(error.message);
  return updated;
}

export async function resolveAllAlertasDb(context: RedacaoRequestContext) {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from('redacao_alertas').update({ 
    resolvido: true, 
    resolvido_por: context.userId,
    resolvido_em: now(),
  }).eq('empresa_id', context.companyId).eq('resolvido', false);
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function getDashboardDb(context: RedacaoRequestContext) {
  const supabase = createSupabaseServerClient();
  
  const { count: totalArtigos } = await supabase.from('redacao_artigos').select('*', { count: 'exact', head: true }).eq('empresa_id', context.companyId);
  const { count: publicados } = await supabase.from('redacao_artigos').select('*', { count: 'exact', head: true }).eq('empresa_id', context.companyId).eq('etapa', 'publicado');
  const { count: pendentes } = await supabase.from('redacao_ugc').select('*', { count: 'exact', head: true }).eq('empresa_id', context.companyId).eq('status', 'pendente');
  const { count: unresolvedAlerts } = await supabase.from('redacao_alertas').select('*', { count: 'exact', head: true }).eq('empresa_id', context.companyId).eq('resolvido', false);
  
  return { total_artigos: totalArtigos || 0, publicados: publicados || 0, pendentes: pendentes || 0, alertas_pendentes: unresolvedAlerts || 0 };
}