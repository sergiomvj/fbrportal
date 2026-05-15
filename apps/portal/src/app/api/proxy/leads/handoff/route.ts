import { handoffToClick } from '@/lib/leads/store';
import { POST as postLeadQualifiedToClick } from '@/app/api/proxy/click/deals/from-lead/route';
import { contextOrResponse, jsonError } from '../_shared';

export async function POST(request: Request) {
  const context = await contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const body = await request.json();
    const leadId = body.lead_id as string;
    if (!leadId) return Response.json({ code: 'BAD_REQUEST', message: 'lead_id is required.' }, { status: 400 });

    const handoff = handoffToClick(context, leadId);
    const clickResponse = await postLeadQualifiedToClick(
      new Request('http://localhost/api/proxy/click/deals/from-lead', {
        body: JSON.stringify(handoff),
        headers: {
          'content-type': 'application/json',
          'x-company-id': context.companyId,
          'x-module-source': 'leads',
          'x-user-id': context.userId,
        },
        method: 'POST',
      }),
    );

    const clickPayload = await clickResponse.json();
    return Response.json(
      {
        deal_id: clickPayload.deal?.id,
        click: clickPayload.deal,
        created: clickPayload.created,
        handoff,
      },
      { status: clickResponse.status },
    );
  } catch (error) {
    return jsonError(error);
  }
}
