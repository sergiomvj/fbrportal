import { createCampaign, deleteCampaign, listCampaigns, updateCampaign } from '@/lib/leads/store';
import { contextOrResponse, jsonError } from '../_shared';

export async function GET(request: Request) {
  const context = await contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    return Response.json({ campaigns: listCampaigns(context) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  const context = await contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    return Response.json({ campaign: createCampaign(context, await request.json()) }, { status: 201 });
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
    const data = Object.fromEntries(Object.entries(body).filter(([key]) => key !== 'id'));
    return Response.json({ campaign: updateCampaign(context, id, data) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request) {
  const context = await contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const body = await request.json();
    const id = body.id as string;
    if (!id) return Response.json({ code: 'BAD_REQUEST', message: 'id is required.' }, { status: 400 });
    return Response.json({ campaign: deleteCampaign(context, id) });
  } catch (error) {
    return jsonError(error);
  }
}
