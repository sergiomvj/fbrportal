import {
  listPartners,
  createPartner,
  parsePartnersQuery,
} from '@/lib/sales/store';
import { contextOrResponse, jsonError } from '../_shared';

export async function GET(request: Request) {
  const contextOr = contextOrResponse(request);
  if (contextOr instanceof Response) return contextOr;
  const context = { ...contextOr, moduleSource: 'fbr-portal' };

  try {
    const result = listPartners(context, parsePartnersQuery(request.url));
    return Response.json({ parceiros: result.items, pagination: result.pagination });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  const contextOr = contextOrResponse(request);
  if (contextOr instanceof Response) return contextOr;
  const { userId } = contextOr;
  const companyId = contextOr.companyId;
  const context = { companyId, userId, moduleSource: 'fbr-portal' };

  try {
    return Response.json({ parceiro: createPartner(context, await request.json()) }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}