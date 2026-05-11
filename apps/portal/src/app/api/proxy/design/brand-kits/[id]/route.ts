import { getBrandKit, previewBrandKitWebhook, updateBrandKit } from '@/lib/design/store';
import { contextOrResponse, jsonError } from '../../_shared';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const { id } = await params;
    return Response.json({
      brand_kit: getBrandKit(context, id),
      social_webhook_preview: previewBrandKitWebhook(context, id),
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const { id } = await params;
    const brandKit = updateBrandKit(context, id, await request.json());
    return Response.json({
      brand_kit: brandKit,
      social_webhook_preview: previewBrandKitWebhook(context, id),
    });
  } catch (error) {
    return jsonError(error);
  }
}
