import { ZodError } from 'zod';
import { contextFromHeaders, FinanceValidationError } from '@/lib/finance/store';

export function contextOrResponse(request: Request) {
  return contextFromHeaders(request.headers);
}

export function jsonError(error: unknown) {
  if (error instanceof FinanceValidationError) {
    return Response.json({ code: error.status === 400 ? 'BAD_REQUEST' : 'VALIDATION_ERROR', message: error.message, issues: error.issues }, { status: error.status });
  }

  if (error instanceof ZodError) {
    return Response.json({ code: 'VALIDATION_ERROR', issues: error.issues }, { status: 400 });
  }

  if (error instanceof Error && error.message === 'Already reconciled') {
    return Response.json({ code: 'CONFLICT', message: error.message }, { status: 409 });
  }

  if (error instanceof Error && error.message === 'Receivable not found') {
    return Response.json({ code: 'NOT_FOUND', message: error.message }, { status: 404 });
  }

  return Response.json({ code: 'FINANCE_PROXY_ERROR', message: error instanceof Error ? error.message : 'Unexpected Finance proxy error.' }, { status: 500 });
}
