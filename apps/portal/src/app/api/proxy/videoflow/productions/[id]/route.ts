import { NextRequest } from 'next/server';
import {
  getProduction,
  updateProduction,
  updateVetorDA,
  advancePipeline,
} from '@/lib/videoflow/store';
import { contextOrResponse, jsonError } from '../../_shared';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contextOr = contextOrResponse(request);
  if (contextOr instanceof Response) return contextOr;
  const { userId } = contextOr;
  const companyId = contextOr.companyId;
  const context = { companyId, userId, moduleSource: 'fbr-portal' };

  try {
    const production = getProduction(context, id);
    return Response.json({ production });
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

    if (action === 'update_vetor_da') {
      const production = updateVetorDA(context, id, body);
      return Response.json({ production });
    }

    if (action === 'advance_pipeline') {
      const production = advancePipeline(context, id);
      return Response.json({ production });
    }

    const production = updateProduction(context, id, body);
    return Response.json({ production });
  } catch (error) {
    return jsonError(error);
  }
}