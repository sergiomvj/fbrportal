import { ZodError } from 'zod';
import { contextFromHeaders } from '@/lib/click/store';

export function contextOrResponse(request: Request) {
  return contextFromHeaders(request.headers);
}

export function jsonError(error: unknown) {
  if (error instanceof ZodError) {
    return Response.json({ code: 'VALIDATION_ERROR', issues: error.issues }, { status: 400 });
  }

  return Response.json({ code: 'CLICK_PROXY_ERROR', message: 'Unexpected Click proxy error.' }, { status: 500 });
}

