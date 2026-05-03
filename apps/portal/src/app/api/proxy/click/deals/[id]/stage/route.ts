import { moveDealStage } from '@/lib/click/store';
import { contextOrResponse, jsonError } from '../../../_shared';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const { id } = await params;
    const deal = moveDealStage(context, id, await request.json());
    if (!deal) {
      return Response.json({ code: 'DEAL_NOT_FOUND', message: 'Deal not found.' }, { status: 404 });
    }

    return Response.json({ deal });
  } catch (error) {
    return jsonError(error);
  }
}
