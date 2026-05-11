import { RedacaoFontes } from '../_components/RedacaoFontes';
import { getRedacaoTestCompanyIds, listFontes } from '@/lib/redacao/store';
import '../redacao.css';

export default function FontesPage() {
  const { alpha, user } = getRedacaoTestCompanyIds();
  const context = { companyId: alpha, moduleSource: 'fbr-portal', userId: user };
  const fontes = listFontes(context);

  return <RedacaoFontes fontes={fontes} />;
}
