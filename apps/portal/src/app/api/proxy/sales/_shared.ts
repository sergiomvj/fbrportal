import { z } from 'zod';

export function contextFromHeaders(headers: Headers) {
  const userId = headers.get('x-user-id');
  const companyId = headers.get('x-company-id') ?? headers.get('x-workspace-id');
  const moduleSource = headers.get('x-module-source') ?? 'fbr-portal';

  if (!userId || !companyId) {
    return Response.json({ code: 'UNAUTHORIZED_CONTEXT', message: 'X-User-Id and company headers are required.' }, { status: 401 });
  }

  return { userId, companyId, moduleSource };
}

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

export function contextOrResponse(request: Request) {
  return contextFromHeaders(request.headers);
}
