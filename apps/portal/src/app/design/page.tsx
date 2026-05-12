import { DesignDashboard } from './_components/DesignDashboard';
import { getDesignDashboardFromPortal } from '@/lib/design/portal-api';

export default async function DesignPage() {
  const payload = await getDesignDashboardFromPortal();
  const { available_agents: availableAgents, snapshot, webhook_previews: webhookPreviews } = payload;

  return (
    <DesignDashboard
      availableAgents={availableAgents}
      initialAgentSlots={snapshot.agent_slots}
      initialBrandKits={snapshot.brand_kits}
      initialDeliverables={snapshot.deliverables}
      initialFormats={snapshot.formats}
      initialJobs={snapshot.jobs}
      initialKpis={snapshot.kpis}
      initialReviewPacks={snapshot.review_packs}
      initialTemplates={snapshot.templates}
      webhookPreviews={webhookPreviews}
    />
  );
}
