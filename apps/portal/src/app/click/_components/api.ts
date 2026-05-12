export async function requestJson<T>(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string'
        ? payload.message
        : 'Nao foi possivel concluir a operacao.';
    throw new Error(message);
  }

  return payload as T;
}
