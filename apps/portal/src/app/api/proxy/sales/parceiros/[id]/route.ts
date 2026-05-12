import { NextRequest } from 'next/server';
import {
  getPartner,
  updatePartner,
  transitionPartnerStage,
  listPartnerEvents,
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
    const parceiro = getPartner(context, id);
    const eventos = listPartnerEvents(context, id);
    return jsonSuccess({ parceiro, eventos });
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
    const body = await request.json();
    if (body?.action === 'transition_stage' || Object.prototype.hasOwnProperty.call(body, 'para')) {
      const parceiro = transitionPartnerStage(context, id, body);
      return jsonSuccess(parceiro);
    }

    const parceiro = updatePartner(context, id, body);
    return jsonSuccess(parceiro);
  } catch (error) {
    return jsonError(error);
  }
}
