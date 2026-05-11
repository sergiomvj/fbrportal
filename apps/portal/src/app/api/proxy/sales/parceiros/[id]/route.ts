import { NextRequest } from 'next/server';
import {
  getPartner,
  updatePartner,
  transitionPartnerStage,
  listPartnerEvents,
} from '@/lib/sales/store';
import { contextOrResponse, jsonError } from '../../_shared';

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
    return Response.json({ parceiro, eventos });
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
    const action = body.action;

    if (action === 'transition_stage') {
      const parceiro = transitionPartnerStage(context, id, body);
      return Response.json({ parceiro });
    }

    const parceiro = updatePartner(context, id, body);
    return Response.json({ parceiro });
  } catch (error) {
    return jsonError(error);
  }
}