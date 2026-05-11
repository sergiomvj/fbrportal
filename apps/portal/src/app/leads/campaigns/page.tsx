import { LeadsCampaigns } from '../_components/LeadsCampaigns';
import { getLeadsTestCompanyIds, listCampaigns, listDomains, listICPs } from '@/lib/leads/store';
import { getMktTestCompanyIds, listCampaigns as listMktCampaigns } from '@/lib/mkt/store';
import '../leads.css';

export default function LeadsCampaignsPage() {
  const { alpha, user } = getLeadsTestCompanyIds();
  const context = { companyId: alpha, moduleSource: 'fbr-portal', userId: user };
  const campaigns = listCampaigns(context);
  const domains = listDomains(context);
  const icps = listICPs(context);
  const mktIds = getMktTestCompanyIds();
  const mktContext = { companyId: mktIds.alpha, moduleSource: 'fbr-portal', userId: mktIds.user };
  const mktCampaigns = listMktCampaigns(mktContext, { page_size: 50 }).items;

  return <LeadsCampaigns campaigns={campaigns} domains={domains} icps={icps} mktCampaigns={mktCampaigns} />;
}
