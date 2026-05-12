import { getDashboardKpis } from '@/lib/sales/store';
import { contextOrResponse, jsonError, jsonSuccess } from '../_shared';

export async function GET(request: Request) {
  const contextOr = contextOrResponse(request);
  if (contextOr instanceof Response) return contextOr;
  const { userId } = contextOr;
  const companyId = contextOr.companyId;
  const context = { companyId, userId, moduleSource: 'fbr-portal' };

  try {
    const kpis = getDashboardKpis(context);
    return jsonSuccess(kpis);
  } catch (error) {
    return jsonError(error);
  }
}
