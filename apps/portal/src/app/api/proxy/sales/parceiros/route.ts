import {
  listPartners,
  createPartner,
  ingestDealClosed,
  parsePartnersQuery,
} from '@/lib/sales/store';
import { contextOrResponse, jsonError, jsonList, jsonSuccess } from '../_shared';

export async function GET(request: Request) {
  const contextOr = contextOrResponse(request);
  if (contextOr instanceof Response) return contextOr;

  try {
    const result = listPartners({ ...contextOr, moduleSource: 'fbr-portal' }, parsePartnersQuery(request.url));
    return jsonList(result.items, result.pagination);
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  const contextOr = contextOrResponse(request);
  if (contextOr instanceof Response) return contextOr;
  const { userId } = contextOr;
  const companyId = contextOr.companyId;

  try {
    const body = await request.json();
    const effectiveContext = { companyId, userId, moduleSource: contextOr.moduleSource };

    if (effectiveContext.moduleSource === 'fbr-click') {
      const result = ingestDealClosed(effectiveContext, body);
      return jsonSuccess(result.partner, { status: result.created ? 201 : 200 });
    }

    return jsonSuccess(createPartner(effectiveContext, body), { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
