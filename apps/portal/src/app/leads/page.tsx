import { LeadsShell } from './_components/LeadsShell';
import { getLeadsTestCompanyIds, getDashboardKpis, listPipelineStages } from '@/lib/leads/store';
import './leads.css';

export default function LeadsPage() {
  const { alpha, user } = getLeadsTestCompanyIds();
  const context = { companyId: alpha, moduleSource: 'fbr-portal', userId: user };
  const kpis = getDashboardKpis(context);
  const stages = listPipelineStages();

  return <LeadsShell kpis={kpis} stages={stages} />;
}
