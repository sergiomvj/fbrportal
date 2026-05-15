export function contextFromHeaders(headers: Headers) {
  const userId = headers.get('x-user-id') ?? '33333333-3333-4333-8333-333333333333';
  const companyId = headers.get('x-company-id') ?? headers.get('x-workspace-id') ?? '11111111-1111-4111-8111-111111111111';
  const moduleSource = headers.get('x-module-source') ?? 'fbr-portal';

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
