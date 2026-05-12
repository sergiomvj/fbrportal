import { contextOrResponse, jsonError } from '../../../_shared';
import { getEstrategia, listVersoes } from '@/lib/mkt/store';
import { enqueueJob } from '@/lib/mkt/queue';
import { withSecurityHeaders } from '@/lib/mkt/security';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const { id } = await params;
    await getEstrategia(id, context);
    const existingVersoes = await listVersoes(id, context);
    const nextVersao = (existingVersoes[0]?.versao ?? 0) + 1;

    await enqueueJob('geracao_estrategia', id, context.companyId, {
      regenerar: true,
      versao: nextVersao,
    });

    return withSecurityHeaders(Response.json({
      message: 'Regeneracao iniciada. Nova versao sera criada.',
      proxima_versao: nextVersao,
    }));
  } catch (error) {
    return jsonError(error);
  }
}
