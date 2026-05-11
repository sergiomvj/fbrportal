import { contextOrResponse, jsonError } from '../../../_shared';
import { getDiagnosticoByEstrategia } from '@/lib/mkt/store';
import { withSecurityHeaders } from '@/lib/mkt/security';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const { id } = await params;
    const diagnostico = getDiagnosticoByEstrategia(id, context);
    return withSecurityHeaders(Response.json({ diagnostico }));
  } catch (error) {
    return jsonError(error);
  }
}
