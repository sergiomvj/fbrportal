import { listAgents, listTemplates } from '@/lib/videoflow/store';
import { contextOrResponse, jsonError } from '../_shared';

export async function GET(request: Request) {
  const contextOr = contextOrResponse(request);
  if (contextOr instanceof Response) return contextOr;
  const { userId } = contextOr;
  const companyId = contextOr.companyId;
  const context = { companyId, userId, moduleSource: 'fbr-portal' };

  try {
    const url = new URL(request.url);
    if (url.searchParams.get('type') === 'templates') {
      const templates = listTemplates(context);
      return Response.json({ templates });
    }
    const agents = listAgents(context);
    return Response.json({ agents });
  } catch (error) {
    return jsonError(error);
  }
}