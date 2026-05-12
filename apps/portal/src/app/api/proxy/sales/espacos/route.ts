import {
  listEspacos,
  createEspaco,
} from '@/lib/sales/store';
import { contextOrResponse, jsonError, jsonSuccess } from '../_shared';

export async function GET(request: Request) {
  const contextOr = contextOrResponse(request);
  if (contextOr instanceof Response) return contextOr;
  const { userId } = contextOr;
  const companyId = contextOr.companyId;
  const context = { companyId, userId, moduleSource: 'fbr-portal' };

  try {
    const url = new URL(request.url);
    const includeInactive = url.searchParams.get('include_inactive') === 'true';
    const espacos = listEspacos(context, includeInactive);
    return jsonSuccess(espacos);
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  const contextOr = contextOrResponse(request);
  if (contextOr instanceof Response) return contextOr;
  const { userId } = contextOr;
  const companyId = contextOr.companyId;
  const context = { companyId, userId, moduleSource: 'fbr-portal' };

  try {
    return jsonSuccess(createEspaco(context, await request.json()), { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
