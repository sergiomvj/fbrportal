import { getSession } from '@fbr/auth';
import { listAgents, toggleAgentPause, listAgentLogs } from '@/lib/leads/store';
import { contextOrResponse, jsonError } from '../_shared';

function isAdminRole(role: string | null | undefined) {
  if (!role) return false;
  const normalized = role.trim().toLowerCase();
  return normalized === 'admin' || normalized === 'super admin' || normalized === 'super_admin';
}

export async function GET(request: Request) {
  try {
    const context = await contextOrResponse(request);
    if (context instanceof Response) return context;

    const url = new URL(request.url);
    const logs = url.searchParams.get('logs') === 'true';
    const result: Record<string, unknown> = { agents: listAgents() };
    if (logs) result.agent_logs = listAgentLogs(50);
    return Response.json(result);
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const context = await contextOrResponse(request);
    if (context instanceof Response) return context;

    const session = await getSession();
    const sessionRole = session?.role ?? request.headers.get('x-user-role');
    if (!isAdminRole(sessionRole)) {
      return Response.json({ code: 'FORBIDDEN', message: 'Admin role required.' }, { status: 403 });
    }

    const body = await request.json();
    const { agent_nome } = body;
    if (!agent_nome) return Response.json({ code: 'BAD_REQUEST', message: 'agent_nome is required.' }, { status: 400 });
    return Response.json({ agent: toggleAgentPause(agent_nome) });
  } catch (error) {
    return jsonError(error);
  }
}
