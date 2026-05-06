import { getProfitLoss } from '@/lib/finance/store';
import { contextOrResponse, jsonError } from '../../_shared';

export async function GET(request: Request, { params }: { params: Promise<{ empresa_id: string }> }) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const { empresa_id } = await params;
    return Response.json({ pl: getProfitLoss(context, empresa_id) });
  } catch (error) {
    return jsonError(error);
  }
}
