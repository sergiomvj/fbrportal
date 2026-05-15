import { headers } from 'next/headers';
import { getInternalApiUrl } from '../api-utils';
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
  const url = await getInternalApiUrl('/api/proxy/redacao/dashboard');
  const response = await fetch(url, { headers: await buildProxyHeaders() });
  const body = await readJson<{ kpis: DashboardKpis }>(response);
  return body.kpis;
}

export async function getRedacaoArtigosFromPortal(query = ''): Promise<Artigo[]> {
  const url = await getInternalApiUrl(`/api/proxy/redacao/artigos${query}`);
  const response = await fetch(url, { headers: await buildProxyHeaders() });
  const body = await readJson<{ artigos: Artigo[] }>(response);
  return body.artigos;
}

export async function getRedacaoPublicadosFromPortal(): Promise<Artigo[]> {
  const url = await getInternalApiUrl('/api/proxy/redacao/publicados');
  const response = await fetch(url, { headers: await buildProxyHeaders() });
  const body = await readJson<{ publicados: Artigo[] }>(response);
  return body.publicados;
}

export async function getRedacaoFontesFromPortal(): Promise<FonteRSS[]> {
  const url = await getInternalApiUrl('/api/proxy/redacao/fontes');
  const response = await fetch(url, { headers: await buildProxyHeaders() });
  const body = await readJson<{ fontes: FonteRSS[] }>(response);
  return body.fontes;
}

export async function getRedacaoUGCFromPortal(): Promise<UGCSubmission[]> {
  const url = await getInternalApiUrl('/api/proxy/redacao/ugc');
  const response = await fetch(url, { headers: await buildProxyHeaders() });
  const body = await readJson<{ ugc: UGCSubmission[] }>(response);
  return body.ugc;
}

export async function getRedacaoAlertasFromPortal(): Promise<Alerta[]> {
  const url = await getInternalApiUrl('/api/proxy/redacao/alertas');
  const response = await fetch(url, { headers: await buildProxyHeaders() });
  const body = await readJson<{ alertas: Alerta[] }>(response);
  return body.alertas;
}
