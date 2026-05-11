import { RedacaoShell } from '../_components/RedacaoShell';
import { getRedacaoTestCompanyIds, getDashboardKpis } from '@/lib/redacao/store';
import '../redacao.css';

export default function AgentesPage() {
  const { alpha, user } = getRedacaoTestCompanyIds();
  const context = { companyId: alpha, moduleSource: 'fbr-portal', userId: user };
  const kpis = getDashboardKpis(context);

  return <RedacaoShell kpis={kpis} />;
}
