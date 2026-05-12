import { createReceivable, listReceivables, parseReceivablesQuery } from '@/lib/finance/store';
import { contextOrResponse, jsonError, jsonList, jsonSuccess } from '../_shared';

export async function GET(request: Request) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const result = listReceivables(context, parseReceivablesQuery(request.url));
    return jsonList(result.items, result.pagination);
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    return jsonSuccess(createReceivable(context, await request.json()), { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
