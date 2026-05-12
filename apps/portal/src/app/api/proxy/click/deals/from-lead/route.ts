import { createDealFromLead } from '@/lib/click/store';
import { contextOrResponse, jsonError } from '../../_shared';

export async function POST(request: Request) {
  const context = await contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const result = createDealFromLead(context, await request.json());
    return Response.json({ deal: result.deal, created: result.created }, { status: result.created ? 201 : 200 });
  } catch (error) {
    return jsonError(error);
  }
}
