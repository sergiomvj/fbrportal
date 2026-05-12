import { runReconciliation } from '@/lib/finance/store';
import { contextOrResponse, jsonError, jsonSuccess } from '../../_shared';

export async function POST(request: Request) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const body = await request.json().catch(() => undefined);
    const job = runReconciliation(context, body);
    return jsonSuccess({
      job_id: job.id,
      status: job.status,
      estimated_seconds: Math.max(5, job.total_items * 2),
      total_movimentos: job.total_items,
    }, { status: 202 });
  } catch (error) {
    return jsonError(error);
  }
}
