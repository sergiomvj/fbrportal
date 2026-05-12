import { triggerAgent } from '@/lib/click/store';
import { contextOrResponse } from '../../../_shared';

export async function POST(request: Request, { params }: { params: Promise<{ agentId: string }> }) {
  const context = await contextOrResponse(request);
  if (context instanceof Response) return context;

  const dealId = new URL(request.url).searchParams.get('deal_id');
  if (!dealId) {
    return Response.json({ code: 'DEAL_ID_MISSING', message: 'deal_id is required.' }, { status: 400 });
  }

  const { agentId } = await params;
  const result = triggerAgent(context, dealId, agentId);
  return Response.json(result.body, { status: result.status });
}
