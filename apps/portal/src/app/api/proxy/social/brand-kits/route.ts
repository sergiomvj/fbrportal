import { listBrandKits } from '@/lib/social/store';
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
