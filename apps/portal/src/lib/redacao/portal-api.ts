import { GET as getDashboard } from '@/app/api/proxy/redacao/dashboard/route';
import { GET as getArtigos } from '@/app/api/proxy/redacao/artigos/route';
import { GET as getPublicados } from '@/app/api/proxy/redacao/publicados/route';
import { GET as getFontes } from '@/app/api/proxy/redacao/fontes/route';
import { GET as getUGC } from '@/app/api/proxy/redacao/ugc/route';
import { GET as getAlertas } from '@/app/api/proxy/redacao/alertas/route';
import { headers } from 'next/headers';
import type { Alerta, Artigo, DashboardKpis, FonteRSS, UGCSubmission } from './types';

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Proxy request failed: ${response.status}`);
  }

  return await response.json() as T;
}

async function buildProxyHeaders() {
  const incoming = await headers();
  const forwarded = new Headers();

  ['x-user-id', 'x-company-id', 'x-workspace-id', 'x-empresa-id', 'x-module-source'].forEach((key) => {
    const value = incoming.get(key);
    if (value) forwarded.set(key, value);
  });

  return forwarded;
}

export async function getRedacaoDashboardFromPortal(): Promise<DashboardKpis> {
  const response = await getDashboard(new Request('http://localhost/api/proxy/redacao/dashboard', { headers: await buildProxyHeaders() }));
  const body = await readJson<{ kpis: DashboardKpis }>(response);
  return body.kpis;
}

export async function getRedacaoArtigosFromPortal(query = ''): Promise<Artigo[]> {
  const response = await getArtigos(new Request(`http://localhost/api/proxy/redacao/artigos${query}`, { headers: await buildProxyHeaders() }));
  const body = await readJson<{ artigos: Artigo[] }>(response);
  return body.artigos;
}

export async function getRedacaoPublicadosFromPortal(): Promise<Artigo[]> {
  const response = await getPublicados(new Request('http://localhost/api/proxy/redacao/publicados', { headers: await buildProxyHeaders() }));
  const body = await readJson<{ publicados: Artigo[] }>(response);
  return body.publicados;
}

export async function getRedacaoFontesFromPortal(): Promise<FonteRSS[]> {
  const response = await getFontes(new Request('http://localhost/api/proxy/redacao/fontes', { headers: await buildProxyHeaders() }));
  const body = await readJson<{ fontes: FonteRSS[] }>(response);
  return body.fontes;
}

export async function getRedacaoUGCFromPortal(): Promise<UGCSubmission[]> {
  const response = await getUGC(new Request('http://localhost/api/proxy/redacao/ugc', { headers: await buildProxyHeaders() }));
  const body = await readJson<{ ugc: UGCSubmission[] }>(response);
  return body.ugc;
}

export async function getRedacaoAlertasFromPortal(): Promise<Alerta[]> {
  const response = await getAlertas(new Request('http://localhost/api/proxy/redacao/alertas', { headers: await buildProxyHeaders() }));
  const body = await readJson<{ alertas: Alerta[] }>(response);
  return body.alertas;
}
