import { VideoFlowDashboard } from './_components/VideoFlowDashboard';
import { getVideoFlowDashboardFromPortal } from '@/lib/videoflow/portal-api';

export default async function VideoFlowPage() {
  const { concepts, kpis, productions, templates } = await getVideoFlowDashboardFromPortal();

  return (
    <VideoFlowDashboard
      initialKpis={kpis}
      initialProductions={productions}
      initialTemplates={templates}
      initialConcepts={concepts}
    />
  );
}
