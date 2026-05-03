import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetRateLimitForTests } from '@/lib/rate-limit';

const signInWithPassword = vi.hoisted(() => vi.fn());
const save = vi.hoisted(() => vi.fn());

vi.mock('@/lib/supabase-admin', () => ({
  createSupabaseServerClient: () => ({
    auth: {
      signInWithPassword,
    },
  }),
}));

vi.mock('iron-session', () => ({
  getIronSession: vi.fn(async () => ({
    save,
    destroy: vi.fn(),
  })),
}));

function createRequest(body: unknown, ip = '127.0.0.1'): Request {
  return new Request('http://localhost/api/auth/login', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': ip,
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

describe('/api/auth/login', () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = 'a'.repeat(32);
    resetRateLimitForTests();
    signInWithPassword.mockReset();
    save.mockReset();
  });

  it('returns a generic error for malformed JSON', async () => {
    const { POST } = await import('./route');
    const response = await POST(createRequest('{') as never);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Credenciais invalidas.' });
  });

  it('rate-limits the sixth request per IP', async () => {
    const { POST } = await import('./route');
    signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { code: 'invalid_credentials', status: 400, message: 'Invalid login credentials' },
    });

    for (let index = 0; index < 5; index += 1) {
      const response = await POST(
        createRequest({ email: 'bad@example.com', password: 'bad' }, '10.0.0.1') as never,
      );
      expect(response.status).toBe(401);
    }

    const blocked = await POST(
      createRequest({ email: 'bad@example.com', password: 'bad' }, '10.0.0.1') as never,
    );
    expect(blocked.status).toBe(429);
  });

  it('creates a local session without returning Supabase tokens', async () => {
    signInWithPassword.mockResolvedValue({
      data: {
        user: {
          id: 'supabase-user-id',
          email: 'operator@example.com',
          user_metadata: {
            role: 'operator',
            empresaId: 'empresa-1',
          },
        },
        session: {
          access_token: 'secret-token',
        },
      },
      error: null,
    });

    const { POST } = await import('./route');
    const response = await POST(
      createRequest({ email: 'operator@example.com', password: 'secret' }) as never,
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(save).toHaveBeenCalledOnce();
  });
});
