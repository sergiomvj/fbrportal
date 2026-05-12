import { listPendingReconciliation } from '@/lib/finance/store';
import { contextOrResponse, jsonError, jsonList } from '../../_shared';

export async function GET(request: Request) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const items = listPendingReconciliation(context);
    return jsonList(items, { total: items.length });
  } catch (error) {
    return jsonError(error);
  }
}
