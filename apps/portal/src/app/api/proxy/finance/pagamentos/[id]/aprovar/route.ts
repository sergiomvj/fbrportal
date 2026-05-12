import { approvePayable } from '@/lib/finance/store';
import { contextOrResponse, jsonError, jsonSuccess } from '../../../_shared';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const { id } = await params;
    return jsonSuccess(approvePayable(context, id, await request.json()));
  } catch (error) {
    return jsonError(error);
  }
}
