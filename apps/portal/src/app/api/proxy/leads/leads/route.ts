import { listLeads, createLead, parseLeadsQuery } from '@/lib/leads/store';
import { contextOrResponse, jsonError } from '../_shared';

export async function GET(request: Request) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const result = listLeads(context, parseLeadsQuery(request.url));
    return Response.json({ leads: result.items, pagination: result.pagination });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    return Response.json({ lead: createLead(context, await request.json()) }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
