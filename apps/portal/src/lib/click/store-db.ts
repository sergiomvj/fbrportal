import { z } from 'zod';
import { createSupabaseServerClient } from '../supabase-admin';

export interface ClickRequestContext {
  userId: string;
  workspaceId: string;
  role: string;
  moduleSource: string;
}

export function contextFromHeaders(headers: Headers, fallbackModuleSource = 'click'): ClickRequestContext | Response {
  const userId = headers.get('x-user-id');
  const workspaceId = headers.get('x-workspace-id') ?? headers.get('x-company-id') ?? headers.get('x-empresa-id');
  const role = (headers.get('x-user-role') ?? 'operator').toLowerCase();
  const moduleSource = headers.get('x-module-source') ?? fallbackModuleSource;

  if (!userId || !workspaceId) {
    return Response.json({ code: 'UNAUTHORIZED_CONTEXT', message: 'X-User-Id and workspace headers are required.' }, { status: 401 });
  }

  return { userId, workspaceId, role: role === 'admin' ? 'admin' : 'operator', moduleSource };
}

function now() {
  return new Date().toISOString();
}

export async function listDealsDb(context: ClickRequestContext) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from('click_deals').select('*').eq('workspaceId', context.workspaceId);
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getDealDb(context: ClickRequestContext, dealId: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from('click_deals').select('*').eq('id', dealId).eq('workspaceId', context.workspaceId).single();
  if (error || !data) throw new Error('Deal not found');
  return data;
}

export async function createDealDb(context: ClickRequestContext, data: unknown) {
  const supabase = createSupabaseServerClient();
  const deal = {
    workspaceId: context.workspaceId,
    userId: context.userId,
    empresaId: context.workspaceId,
    ...(data as object),
    createdAt: now(),
    updatedAt: now(),
  };
  const { data: created, error } = await supabase.from('click_deals').insert(deal).select().single();
  if (error) throw new Error(error.message);
  return created;
}

export async function updateDealStageDb(context: ClickRequestContext, dealId: string, stage: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from('click_deals').update({ stage, updatedAt: now() }).eq('id', dealId).eq('workspaceId', context.workspaceId).select().single();
  if (error || !data) throw new Error('Deal not found');
  return data;
}

export async function listMessagesDb(context: ClickRequestContext, dealId: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from('click_messages').select('*').eq('dealId', dealId).order('createdAt', { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function createMessageDb(context: ClickRequestContext, dealId: string, data: unknown) {
  const supabase = createSupabaseServerClient();
  const message = {
    dealId,
    authorId: context.userId,
    role: context.role,
    ...(data as object),
    createdAt: now(),
  };
  const { data: created, error } = await supabase.from('click_messages').insert(message).select().single();
  if (error) throw new Error(error.message);
  return created;
}

export async function listTasksDb(context: ClickRequestContext, dealId: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from('click_tasks').select('*').eq('dealId', dealId).order('createdAt', { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function createTaskDb(context: ClickRequestContext, dealId: string, data: unknown) {
  const supabase = createSupabaseServerClient();
  const task = {
    dealId,
    assigneeId: context.userId,
    ...(data as object),
    createdAt: now(),
  };
  const { data: created, error } = await supabase.from('click_tasks').insert(task).select().single();
  if (error) throw new Error(error.message);
  return created;
}

export async function updateTaskDb(context: ClickRequestContext, taskId: string, data: unknown) {
  const supabase = createSupabaseServerClient();
  const { data: updated, error } = await supabase.from('click_tasks').update(data as object).eq('id', taskId).select().single();
  if (error) throw new Error(error.message);
  return updated;
}

export async function appendHistoryDb(context: ClickRequestContext, dealId: string, eventType: string, description: string, metadata?: object) {
  const supabase = createSupabaseServerClient();
  const history = {
    dealId,
    eventType,
    description,
    actorId: context.userId,
    actorRole: context.role,
    metadata: metadata || {},
    timestamp: now(),
  };
  const { data: created, error } = await supabase.from('click_deal_history').insert(history).select().single();
  if (error) throw new Error(error.message);
  return created;
}

export async function listAuditLogsDb(context: ClickRequestContext, dealId?: string) {
  const supabase = createSupabaseServerClient();
  let query = supabase.from('click_deal_history').select('*').eq('actorId', context.userId);
  if (dealId) query = query.eq('dealId', dealId);
  const { data, error } = await query.order('timestamp', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}