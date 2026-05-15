import { beforeEach, describe, expect, it, vi } from 'vitest';

const supabaseMocks = vi.hoisted(() => ({
  rpc: vi.fn(),
}));

vi.mock('@/lib/supabase-admin', () => ({
  createSupabaseServerClient: () => ({
    rpc: supabaseMocks.rpc,
  }),
}));

import { checkPersistentRateLimit, rateLimitResponse, resetRateLimitsForTests } from './security';

describe('MKT security contracts', () => {
  beforeEach(() => {
    supabaseMocks.rpc.mockReset();
    resetRateLimitsForTests();
  });

  it('uses the persistent Supabase limiter when the RPC is available', async () => {
    supabaseMocks.rpc.mockReturnValue({
      single: async () => ({
        data: { allowed: true, remaining: 4, reset_at_ms: 1778733600000 },
        error: null,
      }),
    });

    await expect(checkPersistentRateLimit('chat:user:empresa:estrategia', { windowMs: 60_000, maxRequests: 10 }))
      .resolves
      .toEqual({ allowed: true, remaining: 4, resetAt: 1778733600000, source: 'supabase' });
    expect(supabaseMocks.rpc).toHaveBeenCalledWith('mkt_consume_rate_limit', {
      p_key: 'chat:user:empresa:estrategia',
      p_limit: 10,
      p_window_ms: 60_000,
    });
  });

  it('fails closed without process-local counters when the persistent limiter is unavailable', async () => {
    supabaseMocks.rpc.mockReturnValue({
      single: async () => ({
        data: null,
        error: { message: 'RPC unavailable' },
      }),
    });

    await expect(checkPersistentRateLimit('chat:test', { windowMs: 60_000, maxRequests: 2 }))
      .resolves
      .toMatchObject({ allowed: false, remaining: 0, source: 'supabase', unavailable: true });
  });

  it('returns an observable unavailable response when rate limit infrastructure is down', async () => {
    const response = rateLimitResponse({
      remaining: 0,
      resetAt: Date.now() + 60_000,
      unavailable: true,
    });

    await expect(response.json()).resolves.toMatchObject({ code: 'RATE_LIMIT_UNAVAILABLE' });
    expect(response.status).toBe(503);
  });
});
