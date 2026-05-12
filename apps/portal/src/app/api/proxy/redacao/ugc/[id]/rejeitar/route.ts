import { rejeitarUGC } from '@/lib/redacao/store';
import { contextOrResponse, jsonError } from '../../../_shared';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const { id } = await params;
    const body = await request.json() as { motivo?: string };
    return Response.json({ ugc: rejeitarUGC(context, id, body.motivo ?? '') });
  } catch (error) {
    return jsonError(error);
  }
}
