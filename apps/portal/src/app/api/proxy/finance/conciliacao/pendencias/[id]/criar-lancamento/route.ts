import { NextRequest } from 'next/server';
import { createEntryFromReconciliation } from '@/lib/finance/store';
import { contextOrResponse, jsonError, jsonSuccess } from '../../../../_shared';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    return jsonSuccess(createEntryFromReconciliation(context, id, await request.json().catch(() => undefined)), { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
