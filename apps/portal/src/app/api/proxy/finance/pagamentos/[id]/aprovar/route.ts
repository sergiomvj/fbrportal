import { approvePayable } from '@/lib/finance/store';
import { contextOrResponse, jsonError } from '../../../_shared';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const { id } = await params;
    const result = approvePayable(context, id, await request.json());
    if (result instanceof Response) return result;
    return Response.json({ pagamento: result });
  } catch (error) {
    return jsonError(error);
  }
}
