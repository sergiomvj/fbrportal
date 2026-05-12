import { RedacaoShell } from '../_components/RedacaoShell';
import { getRedacaoDashboardFromPortal } from '@/lib/redacao/portal-api';
import '../redacao.css';

export default async function AgentesPage() {
  const kpis = await getRedacaoDashboardFromPortal();

  return <RedacaoShell kpis={kpis} />;
}
