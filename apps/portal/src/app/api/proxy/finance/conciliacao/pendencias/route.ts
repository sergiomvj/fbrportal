import { listPendingReconciliation } from '@/lib/finance/store';
import { contextOrResponse, jsonError } from '../../_shared';

export async function GET(request: Request) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const items = listPendingReconciliation(context);
    return Response.json({ pendencias: items });
  } catch (error) {
    return jsonError(error);
  }
}
