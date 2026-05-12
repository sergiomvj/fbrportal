import { getLeadsPageContext } from '@/lib/leads/context';
import { listReports } from '@/lib/leads/store';
import { LeadsReports } from '../_components/LeadsReports';
import '../leads.css';

export default async function LeadsReportsPage() {
  const context = await getLeadsPageContext();
  const reports = listReports(context);

  return <LeadsReports reports={reports} />;
}
