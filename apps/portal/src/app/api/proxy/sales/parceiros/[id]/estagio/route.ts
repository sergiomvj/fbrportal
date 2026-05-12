import { NextRequest } from 'next/server';
import { transitionPartnerStage } from '@/lib/sales/store';
import { contextOrResponse, jsonError, jsonSuccess } from '../../../_shared';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contextOr = contextOrResponse(request);
  if (contextOr instanceof Response) return contextOr;

  try {
    const parceiro = transitionPartnerStage(contextOr, id, await request.json());
    return jsonSuccess(parceiro);
  } catch (error) {
    return jsonError(error);
  }
}
