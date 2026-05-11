import { contextOrResponse, jsonError } from '../_shared';
import { getAgentsByEmpresa } from '@/lib/mkt/store';
import { withSecurityHeaders } from '@/lib/mkt/security';

export async function GET(request: Request) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const agentsData = getAgentsByEmpresa(context);
    return withSecurityHeaders(Response.json({ agents: agentsData }));
  } catch (error) {
    return jsonError(error);
  }
}
