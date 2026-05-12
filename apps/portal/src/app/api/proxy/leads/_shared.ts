import { z } from 'zod';
import { getLeadsRequestContext } from '@/lib/leads/context';

export function jsonError(error: unknown) {
  if (error instanceof Response) return error;

  if (error instanceof Error && 'status' in error) {
    const ve = error as unknown as { status: number; message: string; issues?: unknown };
    return Response.json({ code: ve.status === 400 ? 'BAD_REQUEST' : 'VALIDATION_ERROR', message: ve.message, issues: ve.issues }, { status: ve.status });
  }

  if (error instanceof z.ZodError) {
    return Response.json({ code: 'VALIDATION_ERROR', issues: error.issues }, { status: 400 });
  }

  if (error instanceof Error && error.message.includes('not found')) {
    return Response.json({ code: 'NOT_FOUND', message: error.message }, { status: 404 });
  }

  return Response.json({ code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' }, { status: 500 });
}

export async function contextOrResponse(request: Request) {
  return getLeadsRequestContext(request);
}
