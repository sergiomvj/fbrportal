import { RedacaoAlertas } from '../_components/RedacaoAlertas';
import { getRedacaoTestCompanyIds, listAlertas } from '@/lib/redacao/store';
import '../redacao.css';

export default function AlertasPage() {
  const { alpha, user } = getRedacaoTestCompanyIds();
  const context = { companyId: alpha, moduleSource: 'fbr-portal', userId: user };
  const alertas = listAlertas(context);

  return <RedacaoAlertas alertas={alertas} />;
}
