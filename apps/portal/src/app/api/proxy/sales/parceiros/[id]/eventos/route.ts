import { NextRequest } from 'next/server';
import { listPartnerEvents } from '@/lib/sales/store';
import { contextOrResponse, jsonError, jsonSuccess } from '../../../_shared';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contextOr = contextOrResponse(request);
  if (contextOr instanceof Response) return contextOr;

  try {
    return jsonSuccess(listPartnerEvents(contextOr, id));
  } catch (error) {
    return jsonError(error);
  }
}
