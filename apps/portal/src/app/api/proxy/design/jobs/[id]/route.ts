import { getDesignJob, updateDesignJob } from '@/lib/design/store';
import { contextOrResponse, jsonError } from '../../_shared';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const { id } = await params;
    return Response.json({ job: getDesignJob(context, id) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const { id } = await params;
    return Response.json({ job: updateDesignJob(context, id, await request.json()) });
  } catch (error) {
    return jsonError(error);
  }
}
