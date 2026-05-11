import { createBrandKit, listBrandKits } from '@/lib/design/store';
import { contextOrResponse, jsonError } from '../_shared';

export async function GET(request: Request) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    return Response.json({ brand_kits: listBrandKits(context) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    return Response.json({ brand_kit: createBrandKit(context, await request.json()) }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
