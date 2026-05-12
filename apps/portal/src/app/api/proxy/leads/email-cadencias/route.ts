import { listEmailCadencias } from '@/lib/leads/store';
import { contextOrResponse, jsonError } from '../_shared';

export async function GET(request: Request) {
  const context = await contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const url = new URL(request.url);
    const leadId = url.searchParams.get('lead_id') ?? undefined;
    return Response.json({ cadencias: listEmailCadencias(context, leadId) });
  } catch (error) {
    return jsonError(error);
  }
}
