import { getSession } from '@fbr/auth';
import { contextFromHeaders, getLeadsTestCompanyIds, type LeadsRequestContext } from './store';

export async function getLeadsPageContext(
  moduleSource = 'leads',
): Promise<LeadsRequestContext> {
  const session = await getSession().catch(() => null);

  if (session) {
    return {
      companyId: session.empresaId,
      moduleSource,
      userId: session.userId,
    };
  }

  const { alpha, user } = getLeadsTestCompanyIds();
  return { companyId: alpha, moduleSource, userId: user };
}

export async function getLeadsRequestContext(
  request: Request,
  moduleSource = 'leads',
): Promise<LeadsRequestContext | Response> {
  const session = await getSession().catch(() => null);

  if (session) {
    return {
      companyId: session.empresaId,
      moduleSource: request.headers.get('x-module-source') ?? moduleSource,
      userId: session.userId,
    };
  }

  return contextFromHeaders(request.headers, moduleSource);
}
