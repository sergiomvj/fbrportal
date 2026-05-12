import { listCostCenters } from '@/lib/finance/store';
import { contextOrResponse, jsonError, jsonSuccess } from '../_shared';

export async function GET(request: Request) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    return jsonSuccess(listCostCenters(context));
  } catch (error) {
    return jsonError(error);
  }
}
