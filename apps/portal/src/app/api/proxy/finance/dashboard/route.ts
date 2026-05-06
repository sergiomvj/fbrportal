import { getDashboardKpis } from '@/lib/finance/store';
import { contextOrResponse, jsonError } from '../_shared';

export async function GET(request: Request) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    return Response.json({ kpis: getDashboardKpis(context) });
  } catch (error) {
    return jsonError(error);
  }
}
