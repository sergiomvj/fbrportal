import { RedacaoFontes } from '../_components/RedacaoFontes';
import { getRedacaoFontesFromPortal } from '@/lib/redacao/portal-api';
import '../redacao.css';

export default async function FontesPage() {
  const fontes = await getRedacaoFontesFromPortal();

  return <RedacaoFontes fontes={fontes} />;
}
