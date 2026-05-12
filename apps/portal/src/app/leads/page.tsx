import { getLeadsPageContext } from '@/lib/leads/context';
import { getDashboardKpis, listPipelineStages } from '@/lib/leads/store';
import { LeadsShell } from './_components/LeadsShell';
import './leads.css';

export default async function LeadsPage() {
  const context = await getLeadsPageContext();
  const kpis = getDashboardKpis(context);
  const stages = listPipelineStages();

  return <LeadsShell kpis={kpis} stages={stages} />;
}
