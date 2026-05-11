import { listTemplateVersions } from '@/lib/social/store';
import { contextOrResponse, jsonError } from '../../../_shared';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const { id } = await params;
    return Response.json({ versions: listTemplateVersions(context, id) });
  } catch (error) {
    return jsonError(error);
  }
}
