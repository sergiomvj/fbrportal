import { getDesignDashboardKpis, listAgentSlots, listTemplates } from '@/lib/design/store';
import { contextOrResponse, jsonError } from '../_shared';

export async function GET(request: Request) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    return Response.json({
      kpis: getDesignDashboardKpis(context),
      agents: listAgentSlots(),
      templates: listTemplates(),
    });
  } catch (error) {
    return jsonError(error);
  }
}
