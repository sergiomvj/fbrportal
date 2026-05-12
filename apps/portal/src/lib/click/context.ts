import { getSession } from '@fbr/auth';
import { contextFromHeaders, type ClickRequestContext } from './store';

function normalizeClickRole(role: string): ClickRequestContext['role'] {
  const normalized = role.trim().toLowerCase();
  return normalized === 'admin' || normalized === 'super admin' || normalized === 'super_admin'
    ? 'admin'
    : 'operator';
}

export async function getClickPageContext(
  moduleSource = 'click',
): Promise<ClickRequestContext> {
  const session = await getSession().catch(() => null);

  if (session) {
    return {
      moduleSource,
      role: normalizeClickRole(session.role),
      userId: session.userId,
      workspaceId: session.empresaId,
    };
  }

  return {
    moduleSource,
    role: 'admin',
    userId: 'operator-1',
    workspaceId: 'empresa-1',
  };
}

export async function getClickRequestContext(
  request: Request,
  moduleSource = 'click',
): Promise<ClickRequestContext | Response> {
  const session = await getSession().catch(() => null);

  if (session) {
    return {
      moduleSource: request.headers.get('x-module-source') ?? moduleSource,
      role: normalizeClickRole(session.role),
      userId: session.userId,
      workspaceId: session.empresaId,
    };
  }

  return contextFromHeaders(request.headers, moduleSource);
}
