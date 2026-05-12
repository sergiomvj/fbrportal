import { RedacaoShell } from './_components/RedacaoShell';
import { getRedacaoDashboardFromPortal } from '@/lib/redacao/portal-api';
import './redacao.css';

export default async function RedacaoPage() {
  const kpis = await getRedacaoDashboardFromPortal();

  return <RedacaoShell kpis={kpis} />;
}
