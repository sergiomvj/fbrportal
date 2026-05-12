import { listEmailTemplates } from '@/lib/leads/store';
import { contextOrResponse, jsonError } from '../_shared';

export async function GET(request: Request) {
  const context = await contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const url = new URL(request.url);
    const icpId = url.searchParams.get('icp_id') ?? undefined;
    return Response.json({ templates: listEmailTemplates(context, icpId) });
  } catch (error) {
    return jsonError(error);
  }
}
