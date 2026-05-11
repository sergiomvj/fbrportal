import { invalidateBrandKitCache, parseAndValidateBrandKitWebhook } from '@/lib/social/store';
import { jsonError } from '../../_shared';

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-webhook-signature');
    const payload = parseAndValidateBrandKitWebhook(body, signature);
    return Response.json(invalidateBrandKitCache(payload));
  } catch (error) {
    return jsonError(error);
  }
}
