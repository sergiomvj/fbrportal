import { reconcileReceivable } from '@/lib/finance/store';
import { contextOrResponse, jsonError } from '../../../_shared';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const { id } = await params;
    return Response.json({ recebimento: reconcileReceivable(context, id, await request.json()) });
  } catch (error) {
    return jsonError(error);
  }
}
