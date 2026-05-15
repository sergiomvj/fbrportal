import { contextOrResponse, jsonError } from '../_shared';
import { getDashboardKpis } from '@/lib/mkt/store';
import { withSecurityHeaders } from '@/lib/mkt/security';

export async function GET(request: Request) {
  const context = await contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    return withSecurityHeaders(Response.json({ kpis: await getDashboardKpis(context) }));
  } catch (error) {
    return jsonError(error);
  }
}
