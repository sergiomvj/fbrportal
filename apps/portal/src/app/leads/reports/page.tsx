import { LeadsReports } from '../_components/LeadsReports';
import { getLeadsTestCompanyIds, listReports } from '@/lib/leads/store';
import '../leads.css';

export default function LeadsReportsPage() {
  const { alpha, user } = getLeadsTestCompanyIds();
  const context = { companyId: alpha, moduleSource: 'fbr-portal', userId: user };
  const reports = listReports(context);

  return <LeadsReports reports={reports} />;
}
