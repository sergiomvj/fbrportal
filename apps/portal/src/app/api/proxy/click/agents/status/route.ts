import { listAgents } from '@/lib/click/store';
import { contextOrResponse } from '../../_shared';

export async function GET(request: Request) {
  const context = await contextOrResponse(request);
  if (context instanceof Response) return context;

  return Response.json({ agents: listAgents(context) });
}
