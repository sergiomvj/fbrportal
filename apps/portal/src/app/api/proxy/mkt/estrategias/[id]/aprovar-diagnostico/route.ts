import { contextOrResponse, jsonError } from '../../../_shared';
import { approveDiagnostico, updateEstrategiaStatus } from '@/lib/mkt/store';
import { enqueueJob } from '@/lib/mkt/queue';
import { withSecurityHeaders } from '@/lib/mkt/security';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const { id } = await params;
    const diagnostico = approveDiagnostico(id, context.userId, context);
    updateEstrategiaStatus(id, 'ativa', context);

    await enqueueJob('geracao_estrategia', id, context.companyId, {
      diagnostico_id: diagnostico.id,
    });

    return withSecurityHeaders(Response.json({ diagnostico, message: 'Diagnostico aprovado. Geracao de estrategia iniciada.' }));
  } catch (error) {
    return jsonError(error);
  }
}
