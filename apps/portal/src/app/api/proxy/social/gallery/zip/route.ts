import { generateZipPackage } from '@/lib/social/store';
import { contextOrResponse, jsonError } from '../../_shared';

export async function POST(request: Request) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const body = await request.json();
    return Response.json(generateZipPackage(context, body.job_id, body.arte_ids));
  } catch (error) {
    return jsonError(error);
  }
}
