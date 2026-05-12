import { EtapaArtigoSchema } from '@/lib/redacao/types';
import { forceArtigoEtapa } from '@/lib/redacao/store';
import { contextOrResponse, jsonError } from '../../../_shared';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const { id } = await params;
    const body = await request.json() as { etapa?: string };
    const etapa = EtapaArtigoSchema.parse(body.etapa);
    return Response.json({ artigo: forceArtigoEtapa(context, id, etapa) });
  } catch (error) {
    return jsonError(error);
  }
}
