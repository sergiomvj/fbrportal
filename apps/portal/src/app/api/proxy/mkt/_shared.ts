import { ZodError } from 'zod';
import { contextFromHeaders, MktValidationError } from '@/lib/mkt/store';
import { withSecurityHeaders } from '@/lib/mkt/security';

export function contextOrResponse(request: Request) {
  return contextFromHeaders(request.headers);
}

export function jsonError(error: unknown) {
  if (error instanceof MktValidationError) {
    return withSecurityHeaders(
      Response.json(
        { code: error.status === 400 ? 'BAD_REQUEST' : 'VALIDATION_ERROR', message: error.message, issues: error.issues },
        { status: error.status },
      ),
    );
  }

  if (error instanceof ZodError) {
    return withSecurityHeaders(
      Response.json({ code: 'VALIDATION_ERROR', issues: error.issues }, { status: 400 }),
    );
  }

  if (error instanceof Error && error.message.includes('not found')) {
    return withSecurityHeaders(
      Response.json({ code: 'NOT_FOUND', message: error.message }, { status: 404 }),
    );
  }

  return withSecurityHeaders(
    Response.json(
      { code: 'MKT_PROXY_ERROR', message: error instanceof Error ? error.message : 'Unexpected MKT proxy error.' },
      { status: 500 },
    ),
  );
}
