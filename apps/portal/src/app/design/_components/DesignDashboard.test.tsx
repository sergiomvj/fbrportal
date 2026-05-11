import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DesignDashboard } from './DesignDashboard';
import { getDesignArvaAgents, getDesignModuleSnapshot, getDesignTestCompanyIds, previewBrandKitWebhook } from '@/lib/design/store';

describe('DesignDashboard', () => {
  it('renders the PRD-aligned design hero, catalog, review surface and agent slots', () => {
    const ids = getDesignTestCompanyIds();
    const context = { companyId: ids.alpha, userId: ids.user, moduleSource: 'fbr-portal' };
    const snapshot = getDesignModuleSnapshot(context);
    const webhookPreviews = Object.fromEntries(
      snapshot.brand_kits.map((brandKit) => [brandKit.id ?? '', previewBrandKitWebhook(context, brandKit.id ?? '')]),
    );

    render(
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
      />,
    );

    expect(screen.getByRole('heading', { name: 'Graphic design as infrastructure' })).toBeInTheDocument();
    expect(screen.getByText('Clientes ativos')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Catalogo de formatos' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Auto-review dashboard' })).toBeInTheDocument();
    expect(screen.getByText('brand_kit.updated')).toBeInTheDocument();

    const agentSection = screen.getByLabelText('Slots de agentes Design');
    ['Compositor', 'Asset Finder', 'Revisor'].forEach((label) => {
      expect(within(agentSection).getByText(label)).toBeInTheDocument();
    });
  });
});
