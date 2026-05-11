import { LeadsICP } from '../_components/LeadsICP';
import { getLeadsTestCompanyIds, listICPs } from '@/lib/leads/store';
import '../leads.css';

export default function LeadsICPPage() {
  const { alpha, user } = getLeadsTestCompanyIds();
  const context = { companyId: alpha, moduleSource: 'fbr-portal', userId: user };
  const icps = listICPs(context);

  return <LeadsICP icps={icps} />;
}
