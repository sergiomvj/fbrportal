import { processFinancialEvent } from '@/lib/finance/store';
import { contextOrResponse, jsonError, jsonSuccess } from '../_shared';

export async function POST(request: Request) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const payable = processFinancialEvent(context, await request.json());
    return jsonSuccess(payable, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
