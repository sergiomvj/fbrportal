import { ZodError } from 'zod';
import { contextFromHeaders, FinanceValidationError } from '@/lib/finance/store';

export function contextOrResponse(request: Request) {
  return contextFromHeaders(request.headers);
}

export function jsonSuccess<T>(data: T, init?: ResponseInit) {
  return Response.json({ success: true, data }, init);
}

export function jsonList<T>(data: T, meta?: Record<string, unknown>, init?: ResponseInit) {
  return Response.json({ success: true, data, meta }, init);
}

export function jsonError(error: unknown) {
  if (error instanceof FinanceValidationError) {
    const code =
      error.status === 400 ? 'BAD_REQUEST' :
      error.status === 403 ? 'FORBIDDEN' :
      error.status === 404 ? 'NOT_FOUND' :
      error.status === 409 ? 'CONFLICT' :
      'VALIDATION_ERROR';
    return Response.json({ success: false, error: { code, message: error.message, issues: error.issues } }, { status: error.status });
  }

  if (error instanceof ZodError) {
    return Response.json({ success: false, error: { code: 'VALIDATION_ERROR', issues: error.issues } }, { status: 400 });
  }

  if (error instanceof Error && error.message === 'Already reconciled') {
    return Response.json({ success: false, error: { code: 'CONFLICT', message: error.message } }, { status: 409 });
  }

  if (error instanceof Error && error.message === 'Receivable not found') {
    return Response.json({ success: false, error: { code: 'NOT_FOUND', message: error.message } }, { status: 404 });
  }

  if (error instanceof Error && error.message.endsWith('not found')) {
    return Response.json({ success: false, error: { code: 'NOT_FOUND', message: error.message } }, { status: 404 });
  }

  return Response.json({ success: false, error: { code: 'FINANCE_PROXY_ERROR', message: error instanceof Error ? error.message : 'Unexpected Finance proxy error.' } }, { status: 500 });
}
