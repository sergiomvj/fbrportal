import { getClickPageContext } from '@/lib/click/context';
import { getKpis, listDeals } from '@/lib/click/store';
import { KpiShell } from './KpiShell';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'KPIs & Metricas | FBR-Click' };

export default async function KpiPage() {
  const context = await getClickPageContext();
  return <KpiShell kpis={getKpis(context)} deals={listDeals(context)} />;
}
