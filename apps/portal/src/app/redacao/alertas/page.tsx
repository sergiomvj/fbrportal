import { RedacaoAlertas } from '../_components/RedacaoAlertas';
import { getRedacaoAlertasFromPortal } from '@/lib/redacao/portal-api';
import '../redacao.css';

export default async function AlertasPage() {
  const alertas = await getRedacaoAlertasFromPortal();

  return <RedacaoAlertas alertas={alertas} />;
}
