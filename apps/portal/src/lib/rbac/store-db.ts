import { z } from 'zod';
import { createSupabaseServerClient } from '../supabase-admin';

export interface RBACRequestContext {
  userId: string;
  companyId: string;
  role: string;
}

export class RBACError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 403 | 404 | 422,
  ) {
    super(message);
  }
}

const COMPANY_ALPHA = '11111111-1111-4111-8111-111111111111';

function now() {
  return new Date().toISOString();
}

export function contextFromHeaders(headers: Headers): RBACRequestContext | Response {
  const userId = headers.get('x-user-id');
  const companyId = headers.get('x-company-id') ?? headers.get('x-workspace-id') ?? COMPANY_ALPHA;
  const role = headers.get('x-role') ?? 'operador';

  if (!userId) {
    return Response.json({ code: 'UNAUTHORIZED', message: 'X-User-Id is required.' }, { status: 401 });
  }

  return { userId, companyId, role };
}

export async function listUsersDb(context: RBACRequestContext) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('portal_users')
    .select('*')
    .eq('empresa_id', context.companyId)
    .order('criado_em', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function getUserDb(context: RBACRequestContext, userId: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('portal_users')
    .select('*')
    .eq('id', userId)
    .eq('empresa_id', context.companyId)
    .single();

  if (error || !data) {
    throw new RBACError('Usuário não encontrado.', 404);
  }

  return data;
}

export async function createUserDb(context: RBACRequestContext, data: unknown) {
  const input = data as Record<string, unknown>;
  const supabase = createSupabaseServerClient();

  const validated = {
    id: input.id as string,
    empresa_id: context.companyId,
    nome: input.nome as string,
    avatar_url: input.avatar_url as string | undefined,
    cargo: input.cargo as string | undefined,
    telefone: input.telefone as string | undefined,
    ativo: input.ativo !== false,
    criado_em: now(),
    atualizado_em: now(),
  };

  const { data: user, error } = await supabase.from('portal_users').insert(validated).select().single();

  if (error) throw new Error(error.message);
  return user;
}

export async function updateUserDb(context: RBACRequestContext, userId: string, data: unknown) {
  const input = data as Record<string, unknown>;
  const supabase = createSupabaseServerClient();

  const update: Record<string, unknown> = { atualizado_em: now() };
  if (input.nome !== undefined) update.nome = input.nome;
  if (input.avatar_url !== undefined) update.avatar_url = input.avatar_url;
  if (input.cargo !== undefined) update.cargo = input.cargo;
  if (input.telefone !== undefined) update.telefone = input.telefone;
  if (input.ativo !== undefined) update.ativo = input.ativo;

  const { data: user, error } = await supabase
    .from('portal_users')
    .update(update)
    .eq('id', userId)
    .eq('empresa_id', context.companyId)
    .select()
    .single();

  if (error || !user) {
    throw new RBACError('Usuário não encontrado.', 404);
  }

  return user;
}

export async function deleteUserDb(context: RBACRequestContext, userId: string) {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from('portal_users')
    .delete()
    .eq('id', userId)
    .eq('empresa_id', context.companyId);

  if (error) throw new Error(error.message);
}

export async function listRolesDb(context: RBACRequestContext) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from('roles').select('*').order('nivel', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function listPermissionsDb(context: RBACRequestContext) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from('permissions').select('*').order('modulo');

  if (error) throw new Error(error.message);
  return data || [];
}

export async function assignRoleDb(context: RBACRequestContext, userId: string, roleId: string) {
  const supabase = createSupabaseServerClient();

  const { error } = await supabase.from('user_roles').insert({
    user_id: userId,
    role_id: roleId,
    empresa_id: context.companyId,
    granted_by: context.userId,
    granted_at: now(),
  });

  if (error) throw new Error(error.message);
  return { success: true };
}

export async function removeRoleDb(context: RBACRequestContext, userId: string, roleId: string) {
  const supabase = createSupabaseServerClient();

  const { error } = await supabase.from('user_roles').delete()
    .eq('user_id', userId)
    .eq('role_id', roleId)
    .eq('empresa_id', context.companyId);

  if (error) throw new Error(error.message);
  return { success: true };
}

export async function getUserPermissionsDb(context: RBACRequestContext, userId: string) {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from('permissions')
    .select(`
      modulo,
      acao,
      descricao
    `)
    .eq('role_permissions.role_id', 
      supabase.from('user_roles').select('role_id').eq('user_id', userId).eq('empresa_id', context.companyId)
    );

  if (error) throw new Error(error.message);
  return data || [];
}

export async function listEmpresasDb() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from('empresas').select('*').eq('ativo', true).order('nome');

  if (error) throw new Error(error.message);
  return data || [];
}

export async function createEmpresaDb(context: RBACRequestContext, data: unknown) {
  const input = data as Record<string, unknown>;
  const supabase = createSupabaseServerClient();

  const empresa = {
    nome: input.nome as string,
    slug: input.slug as string,
    logo_url: input.logo_url as string | undefined,
    plano: (input.plano as string) || 'free',
    ativo: true,
    criado_em: now(),
    atualizado_em: now(),
  };

  const { data: created, error } = await supabase.from('empresas').insert(empresa).select().single();

  if (error) throw new Error(error.message);
  return created;
}

export async function hasPermission(context: RBACRequestContext, modulo: string, acao: string): Promise<boolean> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from('permissions')
    .select('id')
    .eq('modulo', modulo)
    .eq('acao', acao)
    .eq('role_permissions.role_id',
      supabase.from('user_roles').select('role_id').eq('user_id', context.userId).eq('empresa_id', context.companyId)
    )
    .single();

  return !!data && !error;
}