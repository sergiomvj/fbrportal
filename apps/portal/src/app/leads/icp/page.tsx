import { getLeadsPageContext } from '@/lib/leads/context';
import { listICPs } from '@/lib/leads/store';
import { LeadsICP } from '../_components/LeadsICP';
import '../leads.css';

export default async function LeadsICPPage() {
  const context = await getLeadsPageContext();
  const icps = listICPs(context);

  return <LeadsICP icps={icps} />;
}
