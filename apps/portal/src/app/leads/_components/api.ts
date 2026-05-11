export const leadsRequestHeaders: HeadersInit = {
  'content-type': 'application/json',
  'x-user-id': '33333333-3333-4333-8333-333333333333',
  'x-company-id': '11111111-1111-4111-8111-111111111111',
  'x-module-source': 'fbr-portal',
};

export async function requestJson<T>(input: RequestInfo | URL, init: RequestInit = {}): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      ...leadsRequestHeaders,
      ...(init.headers ?? {}),
    },
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string'
        ? payload.message
        : 'Não foi possível concluir a operação.';
    throw new Error(message);
  }

  return payload as T;
}
