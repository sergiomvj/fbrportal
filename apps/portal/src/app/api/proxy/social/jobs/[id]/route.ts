import { SocialJobStatusSchema } from '@/lib/social/types';
import { getJob, updateJobStatus } from '@/lib/social/store';
import { contextOrResponse, jsonError } from '../../_shared';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const { id } = await params;
    return Response.json({ job: getJob(context, id) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = SocialJobStatusSchema.parse(body.status);
    return Response.json({ job: updateJobStatus(context, id, parsed) });
  } catch (error) {
    return jsonError(error);
  }
}
