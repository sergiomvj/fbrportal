import { runReconciliation } from '@/lib/finance/store';
import { contextOrResponse, jsonError } from '../../_shared';

export async function POST(request: Request) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const job = runReconciliation(context);
    return Response.json({ job }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
