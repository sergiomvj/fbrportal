import { getReconciliationStatus } from '@/lib/finance/store';
import { contextOrResponse, jsonError } from '../../../_shared';

export async function GET(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const { jobId } = await params;
    const job = getReconciliationStatus(context, jobId);
    return Response.json({ job });
  } catch (error) {
    return jsonError(error);
  }
}
