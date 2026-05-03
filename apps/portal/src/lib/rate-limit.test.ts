import { beforeEach, describe, expect, it } from 'vitest';
import { checkRateLimit, resetRateLimitForTests } from './rate-limit';

describe('checkRateLimit', () => {
  beforeEach(() => resetRateLimitForTests());

  it('allows five requests per window and blocks the sixth', () => {
    for (let index = 0; index < 5; index += 1) {
      expect(checkRateLimit('ip:1', 5, 60_000, 1_000).allowed).toBe(true);
    }

    expect(checkRateLimit('ip:1', 5, 60_000, 1_000).allowed).toBe(false);
  });

  it('resets after the window expires', () => {
    expect(checkRateLimit('ip:2', 1, 60_000, 1_000).allowed).toBe(true);
    expect(checkRateLimit('ip:2', 1, 60_000, 1_000).allowed).toBe(false);
    expect(checkRateLimit('ip:2', 1, 60_000, 61_001).allowed).toBe(true);
  });
});
