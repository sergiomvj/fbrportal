import { GET as getVideoFlowDashboard } from '@/app/api/proxy/videoflow/dashboard/route';
import { headers } from 'next/headers';
import type { Concept, Production, TemplatePreset, VideoFlowDashboardKpis } from './types';

async function buildProxyHeaders() {
  const incoming = await headers();
  const forwarded = new Headers();

  ['x-user-id', 'x-company-id', 'x-workspace-id', 'x-empresa-id', 'x-module-source'].forEach((key) => {
    const value = incoming.get(key);
    if (value) forwarded.set(key, value);
  });

  return forwarded;
}

export interface VideoFlowPortalDashboardPayload {
  kpis: VideoFlowDashboardKpis;
  productions: Production[];
  templates: TemplatePreset[];
  concepts: Concept[];
}

export async function getVideoFlowDashboardFromPortal(): Promise<VideoFlowPortalDashboardPayload> {
  const response = await getVideoFlowDashboard(new Request('http://localhost/api/proxy/videoflow/dashboard', { headers: await buildProxyHeaders() }));
  if (!response.ok) {
    throw new Error(`Failed to load videoflow dashboard: ${response.status}`);
  }

  return await response.json() as VideoFlowPortalDashboardPayload;
}
