import { VideoFlowDashboard } from './_components/VideoFlowDashboard';
import {
  getVideoFlowTestCompanyIds,
  getVideoFlowDashboardKpis,
  listProductions,
  listTemplates,
  listConcepts,
} from '@/lib/videoflow/store';

export default function VideoFlowPage() {
  const { alpha, user } = getVideoFlowTestCompanyIds();
  const context = { companyId: alpha, moduleSource: 'fbr-portal', userId: user };
  
  const kpis = getVideoFlowDashboardKpis(context);
  const productions = listProductions(context, { page_size: 100 }).items;
  const templates = listTemplates(context);
  const concepts = listConcepts(context);

  return (
    <VideoFlowDashboard
      initialKpis={kpis}
      initialProductions={productions}
      initialTemplates={templates}
      initialConcepts={concepts}
    />
  );
}