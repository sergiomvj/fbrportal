import { getSession } from '@fbr/auth';
import { contextFromHeaders, type MktRequestContext } from './store';

export async function getMktPageContext(
  moduleSource = 'mkt',
): Promise<MktRequestContext> {
  const session = await getSession().catch(() => null);

  if (session) {
    return {
      moduleSource,
      userId: session.userId,
      companyId: session.empresaId,
    };
  }

  // Fallback dev/mock
  return {
    moduleSource,
    userId: '33333333-3333-4333-8333-333333333333',
    companyId: '11111111-1111-4111-8111-111111111111',
  };
}

export async function getMktRequestContext(
  request: Request,
  moduleSource = 'mkt',
): Promise<MktRequestContext | Response> {
  const session = await getSession().catch(() => null);

  if (session) {
    return {
      moduleSource: request.headers.get('x-module-source') ?? moduleSource,
      userId: session.userId,
      companyId: session.empresaId,
    };
  }

  return contextFromHeaders(request.headers);
}
