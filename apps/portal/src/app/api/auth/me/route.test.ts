import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSession = vi.hoisted(() => vi.fn());

vi.mock('@fbr/auth', () => ({
  getSession,
}));

describe('/api/auth/me', () => {
  beforeEach(() => {
    getSession.mockReset();
  });

  it('returns sanitized user data without raw Supabase UUID', async () => {
    getSession.mockResolvedValue({
      userId: 'supabase-user-id',
      email: 'operator@example.com',
      role: 'operator',
      empresaId: 'empresa-1',
    });

    const { GET } = await import('./route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      user: {
        email: 'operator@example.com',
        role: 'operator',
        empresaId: 'empresa-1',
      },
      error: null,
    });
    expect(JSON.stringify(body)).not.toContain('supabase-user-id');
  });

  it('returns 401 when there is no session', async () => {
    getSession.mockResolvedValue(null);

    const { GET } = await import('./route');
    const response = await GET();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ user: null, error: 'Unauthorized.' });
  });
});
