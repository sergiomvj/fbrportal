import { setAgentPaused } from '@/lib/click/store';
import { contextOrResponse, jsonError } from '../../_shared';

export async function PATCH(request: Request, { params }: { params: Promise<{ agentId: string }> }) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const { agentId } = await params;
    const body = (await request.json()) as { paused?: boolean };
    const result = setAgentPaused(context, agentId, Boolean(body.paused));
    return Response.json(result.body, { status: result.status });
  } catch (error) {
    return jsonError(error);
  }
}
