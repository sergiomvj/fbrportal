import {
  ingestDealClosed,
  validateSalesClickWebhookSignature,
} from '@/lib/sales/store';
import { contextOrResponse, jsonError, jsonSuccess } from '../../../_shared';

export async function POST(request: Request) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const secret = process.env.SALES_FBR_CLICK_WEBHOOK_SECRET;
    if (!secret) {
      return Response.json(
        { success: false, error: { code: 'WEBHOOK_SECRET_NOT_CONFIGURED', message: 'Sales FBR-Click webhook secret is not configured.' } },
        { status: 503 },
      );
    }

    const body = await request.text();
    validateSalesClickWebhookSignature(body, request.headers.get('x-webhook-signature'), secret);

    const result = ingestDealClosed({ ...context, moduleSource: 'fbr-click' }, JSON.parse(body));
    return jsonSuccess(result.partner, { status: result.created ? 201 : 200 });
  } catch (error) {
    return jsonError(error);
  }
}
