import { getVideoFlowDashboardKpis } from '@/lib/videoflow/store';
import { contextOrResponse, jsonError } from '../_shared';

export async function GET(request: Request) {
  const contextOr = contextOrResponse(request);
  if (contextOr instanceof Response) return contextOr;
  const { userId } = contextOr;
  const companyId = contextOr.companyId;
  const context = { companyId, userId, moduleSource: 'fbr-portal' };

  try {
    return Response.json({ kpis: getVideoFlowDashboardKpis(context) });
  } catch (error) {
    return jsonError(error);
  }
}