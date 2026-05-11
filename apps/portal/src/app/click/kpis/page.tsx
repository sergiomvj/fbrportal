import { clickDeals, clickKpis } from '@/lib/click/fixtures';
import { KpiShell } from './KpiShell';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'KPIs & Metricas | FBR-Click' };

export default function KpiPage() {
  return <KpiShell kpis={clickKpis} deals={clickDeals} />;
}
