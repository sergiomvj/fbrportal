import { RedacaoPublicados } from '../_components/RedacaoPublicados';
import { getRedacaoTestCompanyIds, listArtigos } from '@/lib/redacao/store';
import '../redacao.css';

export default function PublicadosPage() {
  const { alpha, user } = getRedacaoTestCompanyIds();
  const context = { companyId: alpha, moduleSource: 'fbr-portal', userId: user };
  const artigos = listArtigos(context, { page_size: 100, etapa: ['publicado'] }).items;

  return <RedacaoPublicados artigos={artigos} />;
}
