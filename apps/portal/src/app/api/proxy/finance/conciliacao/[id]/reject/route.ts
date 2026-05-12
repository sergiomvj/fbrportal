import { rejectReconciliationItem } from '@/lib/finance/store';
import { contextOrResponse, jsonError, jsonSuccess } from '../../../_shared';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => undefined);
    return jsonSuccess(rejectReconciliationItem(context, id, body));
  } catch (error) {
    return jsonError(error);
  }
}
