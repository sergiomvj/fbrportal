import { listArtigos } from '@/lib/redacao/store';
import { contextOrResponse, jsonError } from '../_shared';

export async function GET(request: Request) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const publicados = listArtigos(context, { etapa: ['publicado'], page_size: 100 }).items;
    const metricas = {
      total_publicados: publicados.length,
      media_por_dia: publicados.length,
      artigo_mais_recente: publicados[0]?.id ?? null,
    };

    return Response.json({ publicados, metricas });
  } catch (error) {
    return jsonError(error);
  }
}
