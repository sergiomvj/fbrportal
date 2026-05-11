import { LeadsDomains } from '../_components/LeadsDomains';
import { getLeadsTestCompanyIds, listDomains } from '@/lib/leads/store';
import '../leads.css';

export default function LeadsDomainsPage() {
  const { alpha, user } = getLeadsTestCompanyIds();
  const context = { companyId: alpha, moduleSource: 'fbr-portal', userId: user };
  const domains = listDomains(context);

  return <LeadsDomains domains={domains} />;
}
