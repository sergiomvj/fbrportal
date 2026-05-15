import { z } from 'zod';

export function contextFromHeaders(headers: Headers) {
  const userId = headers.get('x-user-id');
  const companyId = headers.get('x-company-id') ?? headers.get('x-workspace-id') ?? headers.get('x-empresa-id');
  const moduleSource = headers.get('x-module-source') ?? 'fbr-portal';

  if (!userId || !companyId) {
    return Response.json({ success: false, error: { code: 'UNAUTHORIZED_CONTEXT', message: 'X-User-Id and company headers are required.' } }, { status: 401 });
  }

  const companyCheck = z.string().uuid().safeParse(companyId);
  if (!companyCheck.success) {
    return Response.json({ success: false, error: { code: 'INVALID_COMPANY', message: 'Company header must be a valid UUID.' } }, { status: 422 });
  }

  return { userId, companyId, moduleSource };
}

export function jsonSuccess<T>(data: T, init?: ResponseInit) {
  return Response.json({ success: true, data }, init);
}

export function jsonList<T>(data: T, meta?: Record<string, unknown>, init?: ResponseInit) {
  return Response.json({ success: true, data, meta }, init);
}

export function jsonError(error: unknown) {
  if (error instanceof Response) return error;

  if (error instanceof Error && 'status' in error) {
    const ve = error as unknown as { status: number; message: string; issues?: unknown };
    const code =
      ve.status === 400 ? 'BAD_REQUEST' :
      ve.status === 401 ? 'UNAUTHORIZED' :
      ve.status === 403 ? 'FORBIDDEN' :
      ve.status === 404 ? 'NOT_FOUND' :
      ve.status === 409 ? 'CONFLICT' :
      'VALIDATION_ERROR';
    return Response.json({ success: false, error: { code, message: ve.message, issues: ve.issues } }, { status: ve.status });
  }

  if (error instanceof z.ZodError) {
    return Response.json({ success: false, error: { code: 'VALIDATION_ERROR', issues: error.issues } }, { status: 400 });
  }

  if (error instanceof Error && error.message.includes('not found')) {
    return Response.json({ success: false, error: { code: 'NOT_FOUND', message: error.message } }, { status: 404 });
  }

  return Response.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } }, { status: 500 });
}

export function contextOrResponse(request: Request) {
  return contextFromHeaders(request.headers);
}
