import { NextRequest } from 'next/server';
import { getMediaKit } from '@/lib/sales/store';
import { contextOrResponse, jsonError } from '../../_shared';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contextOr = contextOrResponse(request);
  if (contextOr instanceof Response) return contextOr;
  const { userId } = contextOr;
  const companyId = contextOr.companyId;
  const context = { companyId, userId, moduleSource: 'fbr-portal' };

  try {
    const mediaKit = getMediaKit(context, id);
    return Response.json({ media_kit: mediaKit });
  } catch (error) {
    return jsonError(error);
  }
}