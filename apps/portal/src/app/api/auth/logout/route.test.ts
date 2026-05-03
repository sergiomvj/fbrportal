import { beforeEach, describe, expect, it, vi } from 'vitest';

const destroy = vi.hoisted(() => vi.fn());

vi.mock('iron-session', () => ({
  getIronSession: vi.fn(async () => ({
    destroy,
    save: vi.fn(),
  })),
}));

describe('/api/auth/logout', () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = 'a'.repeat(32);
    destroy.mockReset();
  });

  it('is idempotent and destroys the local session', async () => {
    const { POST } = await import('./route');
    const response = await POST(
      new Request('http://localhost/api/auth/logout', { method: 'POST' }) as never,
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(destroy).toHaveBeenCalledOnce();
  });
});
