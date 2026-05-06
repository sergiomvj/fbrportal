import { rejectReconciliationItem } from '@/lib/finance/store';
import { contextOrResponse, jsonError } from '../../../_shared';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const { id } = await params;
    const item = rejectReconciliationItem(context, id);
    return Response.json({ item });
  } catch (error) {
    return jsonError(error);
  }
}
