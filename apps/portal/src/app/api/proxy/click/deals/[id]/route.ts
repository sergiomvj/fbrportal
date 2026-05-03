import { getDeal } from '@/lib/click/store';
import { contextOrResponse } from '../../_shared';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  const { id } = await params;
  const deal = getDeal(context, id);
  if (!deal) {
    return Response.json({ code: 'DEAL_NOT_FOUND', message: 'Deal not found.' }, { status: 404 });
  }

  return Response.json({ deal });
}
