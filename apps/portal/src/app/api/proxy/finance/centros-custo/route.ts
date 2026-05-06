import { listCostCenters } from '@/lib/finance/store';
import { contextOrResponse, jsonError } from '../_shared';

export async function GET(request: Request) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    return Response.json({ centros_custo: listCostCenters(context) });
  } catch (error) {
    return jsonError(error);
  }
}
