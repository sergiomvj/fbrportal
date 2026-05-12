import { NextRequest } from 'next/server';
import {
  getEspaco,
  updateEspaco,
  getEspacoPerformance,
} from '@/lib/sales/store';
import { contextOrResponse, jsonError, jsonSuccess } from '../../_shared';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contextOr = contextOrResponse(request);
  if (contextOr instanceof Response) return contextOr;
  const { userId } = contextOr;
  const companyId = contextOr.companyId;
  const context = { companyId, userId, moduleSource: 'fbr-portal' };

  try {
    const url = new URL(request.url);
    if (url.searchParams.get('performance') === 'true') {
      const performance = getEspacoPerformance(context, id);
      return jsonSuccess(performance);
    }
    const espaco = getEspaco(context, id);
    return jsonSuccess(espaco);
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contextOr = contextOrResponse(request);
  if (contextOr instanceof Response) return contextOr;
  const { userId } = contextOr;
  const companyId = contextOr.companyId;
  const context = { companyId, userId, moduleSource: 'fbr-portal' };

  try {
    const espaco = updateEspaco(context, id, await request.json());
    return jsonSuccess(espaco);
  } catch (error) {
    return jsonError(error);
  }
}
