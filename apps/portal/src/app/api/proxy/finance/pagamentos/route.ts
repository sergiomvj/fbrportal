import { createPayable, listPayables, parsePayablesQuery } from '@/lib/finance/store';
import { contextOrResponse, jsonError } from '../_shared';

export async function GET(request: Request) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const result = listPayables(context, parsePayablesQuery(request.url));
    return Response.json({ pagamentos: result.items, pagination: result.pagination });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    return Response.json({ pagamento: createPayable(context, await request.json()) }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
