import { listAgents, toggleAgentPause, listAgentLogs } from '@/lib/leads/store';
import { jsonError } from '../_shared';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const companyId = url.searchParams.get('company_id') ?? undefined;
    const logs = url.searchParams.get('logs') === 'true';
    const result: Record<string, unknown> = { agents: listAgents(companyId) };
    if (logs) result.agent_logs = listAgentLogs(50);
    return Response.json(result);
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { agent_nome } = body;
    if (!agent_nome) return Response.json({ code: 'BAD_REQUEST', message: 'agent_nome is required.' }, { status: 400 });
    return Response.json({ agent: toggleAgentPause(agent_nome) });
  } catch (error) {
    return jsonError(error);
  }
}
