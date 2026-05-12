import { getLeadsPageContext } from '@/lib/leads/context';
import { listAgents, listAgentLogs } from '@/lib/leads/store';
import { LeadsAgents } from '../_components/LeadsAgents';
import '../leads.css';

export default async function LeadsAgentsPage() {
  const context = await getLeadsPageContext();
  const agents = listAgents();
  const agentLogs = listAgentLogs(50);

  return <LeadsAgents agents={agents} agentLogs={agentLogs} companyId={context.companyId} />;
}
