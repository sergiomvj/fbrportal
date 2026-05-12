import { getLeadsPageContext } from '@/lib/leads/context';
import { listDomains } from '@/lib/leads/store';
import { LeadsDomains } from '../_components/LeadsDomains';
import '../leads.css';

export default async function LeadsDomainsPage() {
  const context = await getLeadsPageContext();
  const domains = listDomains(context);

  return <LeadsDomains domains={domains} />;
}
