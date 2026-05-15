import { contextOrResponse, jsonError } from '../../../_shared';
import { listCopyByEstrategia, listLeadMagnetsByEstrategia } from '@/lib/mkt/store';
import { withSecurityHeaders } from '@/lib/mkt/security';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const { id } = await params;
    const copy = await listCopyByEstrategia(id, context);
    const lead_magnets = await listLeadMagnetsByEstrategia(id, context);
    return withSecurityHeaders(Response.json({ copy, lead_magnets }));
  } catch (error) {
    return jsonError(error);
  }
}
