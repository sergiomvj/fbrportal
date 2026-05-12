import { aceitarUGC } from '@/lib/redacao/store';
import { contextOrResponse, jsonError } from '../../../_shared';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const { id } = await params;
    return Response.json(aceitarUGC(context, id));
  } catch (error) {
    return jsonError(error);
  }
}
