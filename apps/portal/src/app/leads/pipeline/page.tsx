import { getLeadsPageContext } from '@/lib/leads/context';
import { listLeads, listPipelineStages } from '@/lib/leads/store';
import { LeadsPipeline } from '../_components/LeadsPipeline';
import '../leads.css';

export default async function LeadsPipelinePage() {
  const context = await getLeadsPageContext();
  const leads = listLeads(context, { page_size: 100 }).items;
  const stages = listPipelineStages();

  return <LeadsPipeline initialLeads={leads} initialStages={stages} />;
}
