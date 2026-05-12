import { RedacaoPublicados } from '../_components/RedacaoPublicados';
import { getRedacaoPublicadosFromPortal } from '@/lib/redacao/portal-api';
import '../redacao.css';

export default async function PublicadosPage() {
  const artigos = await getRedacaoPublicadosFromPortal();

  return <RedacaoPublicados artigos={artigos} />;
}
