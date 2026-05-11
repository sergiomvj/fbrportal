import { LeadsPipeline } from '../_components/LeadsPipeline';
import { getLeadsTestCompanyIds, listLeads, listPipelineStages } from '@/lib/leads/store';
import '../leads.css';

export default function LeadsPipelinePage() {
  const { alpha, user } = getLeadsTestCompanyIds();
  const context = { companyId: alpha, moduleSource: 'fbr-portal', userId: user };
  const leads = listLeads(context, { page_size: 100 }).items;
  const stages = listPipelineStages();

  return <LeadsPipeline initialLeads={leads} initialStages={stages} />;
}
