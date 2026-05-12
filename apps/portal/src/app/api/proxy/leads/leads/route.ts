import { avancarEtapa, createLead, listLeads, parseLeadsQuery, updateLead } from '@/lib/leads/store';
import { contextOrResponse, jsonError } from '../_shared';

export async function GET(request: Request) {
  const context = await contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const result = listLeads(context, parseLeadsQuery(request.url));
    return Response.json({ leads: result.items, pagination: result.pagination });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  const context = await contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    return Response.json({ lead: createLead(context, await request.json()) }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request) {
  const context = await contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const body = await request.json();
    const id = body.id as string;
    if (!id) return Response.json({ code: 'BAD_REQUEST', message: 'id is required.' }, { status: 400 });

    if (typeof body.etapa === 'string' && Object.keys(body).length === 2) {
      return Response.json({ lead: avancarEtapa(context, id, body.etapa) });
    }

    const data = Object.fromEntries(Object.entries(body).filter(([key]) => key !== 'id'));
    return Response.json({ lead: updateLead(context, id, data) });
  } catch (error) {
    return jsonError(error);
  }
}
