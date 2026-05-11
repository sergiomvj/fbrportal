import { contextOrResponse, jsonError } from '../../../_shared';
import { listVersoes } from '@/lib/mkt/store';
import { withSecurityHeaders } from '@/lib/mkt/security';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const { id } = await params;
    const versoesData = listVersoes(id, context);
    const latest = versoesData[0] ?? null;
    return withSecurityHeaders(Response.json({ versao: latest, versoes: versoesData }));
  } catch (error) {
    return jsonError(error);
  }
}
