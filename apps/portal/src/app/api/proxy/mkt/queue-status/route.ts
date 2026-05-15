import { contextOrResponse, jsonError } from '../_shared';
import { getQueueStatus } from '@/lib/mkt/queue';
import { withSecurityHeaders } from '@/lib/mkt/security';

export async function GET(request: Request) {
  const context = await contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const status = await getQueueStatus(context.companyId);
    return withSecurityHeaders(Response.json({ queues: status }));
  } catch (error) {
    return jsonError(error);
  }
}
