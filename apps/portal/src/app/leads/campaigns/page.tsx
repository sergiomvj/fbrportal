import { LeadsCampaigns } from '../_components/LeadsCampaigns';
import { getLeadsTestCompanyIds, listCampaigns } from '@/lib/leads/store';
import '../leads.css';

export default function LeadsCampaignsPage() {
  const { alpha, user } = getLeadsTestCompanyIds();
  const context = { companyId: alpha, moduleSource: 'fbr-portal', userId: user };
  const campaigns = listCampaigns(context);

  return <LeadsCampaigns campaigns={campaigns} />;
}
