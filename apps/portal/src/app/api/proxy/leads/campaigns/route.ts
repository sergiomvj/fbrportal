import { listCampaigns, createCampaign } from '@/lib/leads/store';
import { contextOrResponse, jsonError } from '../_shared';

export async function GET(request: Request) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    return Response.json({ campaigns: listCampaigns(context) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    return Response.json({ campaign: createCampaign(context, await request.json()) }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
