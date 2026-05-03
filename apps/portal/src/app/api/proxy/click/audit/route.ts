import { listAudit } from '@/lib/click/store';
import { contextOrResponse } from '../_shared';

export async function GET(request: Request) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  const dealId = new URL(request.url).searchParams.get('deal_id');
  return Response.json({ audit: listAudit(context, dealId) });
}

