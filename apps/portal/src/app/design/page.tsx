import { DesignDashboard } from './_components/DesignDashboard';
import {
  getDesignArvaAgents,
  getDesignModuleSnapshot,
  getDesignTestCompanyIds,
  previewBrandKitWebhook,
} from '@/lib/design/store';

export default function DesignPage() {
  const { alpha, user } = getDesignTestCompanyIds();
  const context = { companyId: alpha, moduleSource: 'fbr-portal', userId: user };
  const snapshot = getDesignModuleSnapshot(context);
  const webhookPreviews = Object.fromEntries(
    snapshot.brand_kits.map((brandKit) => [brandKit.id ?? '', previewBrandKitWebhook(context, brandKit.id ?? '')]),
  );

  return (
    <DesignDashboard
      availableAgents={getDesignArvaAgents()}
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
