import { previewBrandKitWebhook } from '@/lib/design/store';
import { contextOrResponse, jsonError } from '../../_shared';

export async function POST(request: Request) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const body = (await request.json()) as { brand_kit_id?: string };
    if (!body.brand_kit_id) {
      return Response.json({ code: 'BAD_REQUEST', message: 'brand_kit_id is required.' }, { status: 400 });
    }

    return Response.json({ webhook: previewBrandKitWebhook(context, body.brand_kit_id) });
  } catch (error) {
    return jsonError(error);
  }
}
