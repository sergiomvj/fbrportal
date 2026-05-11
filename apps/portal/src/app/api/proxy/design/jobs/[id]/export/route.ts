import { exportCreative } from '@/lib/design/store';
import { contextOrResponse, jsonError } from '../../../_shared';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const { id } = await params;
    return Response.json({ export: exportCreative(context, id, await request.json()) }, { status: 202 });
  } catch (error) {
    return jsonError(error);
  }
}
