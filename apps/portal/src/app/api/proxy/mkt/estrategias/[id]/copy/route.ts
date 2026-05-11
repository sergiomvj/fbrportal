import { contextOrResponse, jsonError } from '../../../_shared';
import { listCopyByEstrategia } from '@/lib/mkt/store';
import { withSecurityHeaders } from '@/lib/mkt/security';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const { id } = await params;
    const copy = listCopyByEstrategia(id, context);
    return withSecurityHeaders(Response.json({ copy }));
  } catch (error) {
    return jsonError(error);
  }
}
