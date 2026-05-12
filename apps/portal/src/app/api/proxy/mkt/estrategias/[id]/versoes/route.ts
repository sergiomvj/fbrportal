import { contextOrResponse, jsonError } from '../../../_shared';
import { listVersoes } from '@/lib/mkt/store';
import { withSecurityHeaders } from '@/lib/mkt/security';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const { id } = await params;
    const versoesData = listVersoes(id, context);
    return withSecurityHeaders(Response.json({ versoes: versoesData }));
  } catch (error) {
    return jsonError(error);
  }
}
