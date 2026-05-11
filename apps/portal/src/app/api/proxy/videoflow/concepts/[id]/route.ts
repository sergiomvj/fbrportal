import { NextRequest } from 'next/server';
import { getConcept, approveConcept } from '@/lib/videoflow/store';
import { contextOrResponse, jsonError } from '../../_shared';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contextOr = contextOrResponse(request);
  if (contextOr instanceof Response) return contextOr;
  const { userId } = contextOr;
  const companyId = contextOr.companyId;
  const context = { companyId, userId, moduleSource: 'fbr-portal' };

  try {
    const concept = getConcept(context, id);
    return Response.json({ concept });
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
    if (body.action === 'approve') {
      const concept = approveConcept(context, id);
      return Response.json({ concept });
    }
    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return jsonError(error);
  }
}