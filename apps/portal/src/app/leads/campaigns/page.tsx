import { getLeadsPageContext } from '@/lib/leads/context';
import { getMktTestCompanyIds, listCampaigns as listMktCampaigns } from '@/lib/mkt/store';
import { listCampaigns, listDomains, listICPs } from '@/lib/leads/store';
import { LeadsCampaigns } from '../_components/LeadsCampaigns';
import '../leads.css';

export const dynamic = 'force-dynamic';

export default async function LeadsCampaignsPage() {
  const context = await getLeadsPageContext();
  const campaigns = listCampaigns(context);
  const domains = listDomains(context);
  const icps = listICPs(context);
  const mktIds = getMktTestCompanyIds();
  const mktContext = { companyId: mktIds.alpha, moduleSource: 'fbr-portal', userId: mktIds.user };
  const mktCampaigns = (await listMktCampaigns(mktContext, { page_size: 50 })).items;

  return <LeadsCampaigns campaigns={campaigns} domains={domains} icps={icps} mktCampaigns={mktCampaigns} />;
}
