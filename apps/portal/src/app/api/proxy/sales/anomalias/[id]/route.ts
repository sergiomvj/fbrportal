import { NextRequest } from 'next/server';
import { reviewAnomaly } from '@/lib/sales/store';
import { contextOrResponse, jsonError } from '../../_shared';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contextOr = contextOrResponse(request);
  if (contextOr instanceof Response) return contextOr;
  const { userId } = contextOr;
  const companyId = contextOr.companyId;
  const context = { companyId, userId, moduleSource: 'fbr-portal' };

  try {
    const body = await request.json();
    const anomaly = reviewAnomaly(context, id, body);
    return Response.json({ anomaly });
  } catch (error) {
    return jsonError(error);
  }
}