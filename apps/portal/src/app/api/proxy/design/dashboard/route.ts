import { getDesignArvaAgents, getDesignModuleSnapshot, previewBrandKitWebhook } from '@/lib/design/store';
import { contextOrResponse, jsonError } from '../_shared';

export async function GET(request: Request) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const snapshot = getDesignModuleSnapshot(context);
    const webhookPreviews = Object.fromEntries(
      snapshot.brand_kits.map((brandKit) => [brandKit.id ?? '', previewBrandKitWebhook(context, brandKit.id ?? '')]),
    );

    return Response.json({
      snapshot,
      available_agents: getDesignArvaAgents(),
      webhook_previews: webhookPreviews,
    });
  } catch (error) {
    return jsonError(error);
  }
}
