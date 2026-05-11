import { RedacaoProducao } from '../_components/RedacaoProducao';
import { getRedacaoTestCompanyIds, listArtigos } from '@/lib/redacao/store';
import '../redacao.css';

export default function ProducaoPage() {
  const { alpha, user } = getRedacaoTestCompanyIds();
  const context = { companyId: alpha, moduleSource: 'fbr-portal', userId: user };
  const artigos = listArtigos(context, { page_size: 100 }).items;

  return <RedacaoProducao initialArtigos={artigos} />;
}
