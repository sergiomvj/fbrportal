import { RedacaoUGC } from '../_components/RedacaoUGC';
import { getRedacaoUGCFromPortal } from '@/lib/redacao/portal-api';
import '../redacao.css';

export default async function UGCPage() {
  const ugc = await getRedacaoUGCFromPortal();

  return <RedacaoUGC ugc={ugc} />;
}
