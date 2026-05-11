import { RedacaoUGC } from '../_components/RedacaoUGC';
import { getRedacaoTestCompanyIds, listUGC } from '@/lib/redacao/store';
import '../redacao.css';

export default function UGCPage() {
  const { alpha, user } = getRedacaoTestCompanyIds();
  const context = { companyId: alpha, moduleSource: 'fbr-portal', userId: user };
  const ugc = listUGC(context);

  return <RedacaoUGC ugc={ugc} />;
}
