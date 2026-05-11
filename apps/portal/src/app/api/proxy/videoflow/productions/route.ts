import {
  listProductions,
  createProduction,
  parseProductionQuery,
} from '@/lib/videoflow/store';
import { contextOrResponse, jsonError } from '../_shared';

export async function GET(request: Request) {
  const contextOr = contextOrResponse(request);
  if (contextOr instanceof Response) return contextOr;
  const { userId } = contextOr;
  const companyId = contextOr.companyId;
  const context = { companyId, userId, moduleSource: 'fbr-portal' };

  try {
    const result = listProductions(context, parseProductionQuery(request.url));
    return Response.json({ productions: result.items, pagination: result.pagination });
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
    return Response.json({ production: createProduction(context, await request.json()) }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}