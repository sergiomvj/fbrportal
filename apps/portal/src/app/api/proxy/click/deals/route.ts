import { createManualDeal, getKpis, listDeals } from '@/lib/click/store';
import { contextOrResponse, jsonError } from '../_shared';

export async function GET(request: Request) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  return Response.json({ deals: listDeals(context), kpis: getKpis(context) });
}

export async function POST(request: Request) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    return Response.json({ deal: createManualDeal(context, await request.json()) }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}

