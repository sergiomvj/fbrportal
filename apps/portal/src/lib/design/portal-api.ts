import { GET as getDesignDashboard } from '@/app/api/proxy/design/dashboard/route';
import { headers } from 'next/headers';
import type { DesignModuleSnapshot, DesignWebhookPreview } from './types';
import type { ArvaAgent } from '@fbr/arva-integration';

async function buildProxyHeaders() {
  const incoming = await headers();
  const forwarded = new Headers();

  ['x-user-id', 'x-company-id', 'x-workspace-id', 'x-empresa-id', 'x-module-source'].forEach((key) => {
    const value = incoming.get(key);
    if (value) forwarded.set(key, value);
  });

  return forwarded;
}

export interface DesignPortalDashboardPayload {
  snapshot: DesignModuleSnapshot;
  available_agents: ArvaAgent[];
  webhook_previews: Record<string, DesignWebhookPreview>;
}

export async function getDesignDashboardFromPortal(): Promise<DesignPortalDashboardPayload> {
  const response = await getDesignDashboard(new Request('http://localhost/api/proxy/design/dashboard', { headers: await buildProxyHeaders() }));
  if (!response.ok) {
    throw new Error(`Failed to load design dashboard: ${response.status}`);
  }

  return await response.json() as DesignPortalDashboardPayload;
}
