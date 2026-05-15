import { headers } from 'next/headers';
import { getInternalApiUrl } from '../api-utils';
import type { SocialDashboardSnapshot } from './types';

async function buildProxyHeaders() {
  const incoming = await headers();
  const forwarded = new Headers();

  ['x-user-id', 'x-user-role', 'x-company-id', 'x-workspace-id', 'x-empresa-id', 'x-module-source'].forEach((key) => {
    const value = incoming.get(key);
    if (value) forwarded.set(key, value);
  });

  return forwarded;
}

export async function getSocialDashboardFromPortal(): Promise<SocialDashboardSnapshot> {
  const url = await getInternalApiUrl('/api/proxy/social/dashboard');
  const response = await fetch(url, { headers: await buildProxyHeaders() });
  if (!response.ok) {
    throw new Error(`Failed to load social dashboard: ${response.status}`);
  }

  const body = await response.json() as { dashboard: SocialDashboardSnapshot };
  return body.dashboard;
}
