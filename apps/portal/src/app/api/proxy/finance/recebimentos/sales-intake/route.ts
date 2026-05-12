import { processSalesIntake } from '@/lib/finance/store';
import { contextOrResponse, jsonError, jsonSuccess } from '../../_shared';

export async function POST(request: Request) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const result = processSalesIntake(context, await request.json());
    return jsonSuccess(result.receivable, { status: result.created ? 201 : 200 });
  } catch (error) {
    return jsonError(error);
  }
}
