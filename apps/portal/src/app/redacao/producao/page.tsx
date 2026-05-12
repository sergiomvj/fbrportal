import { RedacaoProducao } from '../_components/RedacaoProducao';
import { getRedacaoArtigosFromPortal } from '@/lib/redacao/portal-api';
import '../redacao.css';

export default async function ProducaoPage() {
  const artigos = await getRedacaoArtigosFromPortal('?page_size=100');

  return <RedacaoProducao initialArtigos={artigos} />;
}
