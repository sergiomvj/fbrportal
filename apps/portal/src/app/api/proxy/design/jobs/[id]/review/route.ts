import { getReviewPack } from '@/lib/design/store';
import { contextOrResponse, jsonError } from '../../../_shared';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const { id } = await params;
    const variantId = new URL(request.url).searchParams.get('variant_id') ?? undefined;
    return Response.json({ review: getReviewPack(context, id, variantId) });
  } catch (error) {
    return jsonError(error);
  }
}
