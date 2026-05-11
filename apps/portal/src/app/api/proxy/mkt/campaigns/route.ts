import { createCampaign, listCampaigns, parseCampaignsQuery } from '@/lib/mkt/store';
import { contextOrResponse, jsonError } from '../_shared';

export async function GET(request: Request) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const result = await listCampaigns(context, parseCampaignsQuery(request.url));
    return Response.json({ campanhas: result.items, pagination: result.pagination });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    return Response.json({ campanha: await createCampaign(context, await request.json()) }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
