import { listActivityLog, listAgentSlots } from '@/lib/design/store';
import { contextOrResponse, jsonError } from '../../_shared';

export async function GET(request: Request) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    return Response.json({ agents: listAgentSlots(), log: listActivityLog() });
  } catch (error) {
    return jsonError(error);
  }
}
