import { contextOrResponse, jsonError } from '../_shared';
import { listAgentLogs } from '@/lib/mkt/store';
import { withSecurityHeaders } from '@/lib/mkt/security';

export async function GET(request: Request) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const url = new URL(request.url);
    const limit = Math.min(Number(url.searchParams.get('limit') ?? '50'), 200);
    const logs = listAgentLogs(context, limit);
    return withSecurityHeaders(Response.json({ logs }));
  } catch (error) {
    return jsonError(error);
  }
}
