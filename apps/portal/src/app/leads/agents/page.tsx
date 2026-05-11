import { LeadsAgents } from '../_components/LeadsAgents';
import { getLeadsTestCompanyIds, listAgents, listAgentLogs } from '@/lib/leads/store';
import '../leads.css';

export default function LeadsAgentsPage() {
  getLeadsTestCompanyIds();
  const agents = listAgents();
  const agentLogs = listAgentLogs(50);

  return <LeadsAgents agents={agents} agentLogs={agentLogs} />;
}
