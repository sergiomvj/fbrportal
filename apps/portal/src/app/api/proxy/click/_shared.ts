import { ZodError } from 'zod';
import { getClickRequestContext } from '@/lib/click/context';

export async function contextOrResponse(request: Request) {
  return getClickRequestContext(request);
}

export function jsonError(error: unknown) {
  if (error instanceof ZodError) {
    return Response.json({ code: 'VALIDATION_ERROR', issues: error.issues }, { status: 400 });
  }

  return Response.json({ code: 'CLICK_PROXY_ERROR', message: 'Unexpected Click proxy error.' }, { status: 500 });
}
