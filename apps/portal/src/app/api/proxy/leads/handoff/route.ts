import { handoffToClick } from '@/lib/leads/store';
import { contextOrResponse, jsonError } from '../_shared';

export async function POST(request: Request) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const body = await request.json();
    const leadId = body.lead_id as string;
    if (!leadId) return Response.json({ code: 'BAD_REQUEST', message: 'lead_id is required.' }, { status: 400 });
    return Response.json({ handoff: handoffToClick(context, leadId) }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
