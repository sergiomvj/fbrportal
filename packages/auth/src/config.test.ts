import { afterEach, describe, expect, it } from 'vitest';
import { createSessionOptions, getSessionPassword } from './config';

const originalSecret = process.env.SESSION_SECRET;

afterEach(() => {
  process.env.SESSION_SECRET = originalSecret;
});

describe('session config', () => {
  it('rejects missing SESSION_SECRET', () => {
    delete process.env.SESSION_SECRET;

    expect(() => getSessionPassword()).toThrow(/32 characters/);
  });

  it('rejects short SESSION_SECRET', () => {
    process.env.SESSION_SECRET = 'a'.repeat(31);

    expect(() => getSessionPassword()).toThrow(/32 characters/);
  });

  it('uses fbr_session as cookie name', () => {
    process.env.SESSION_SECRET = 'a'.repeat(32);

    expect(createSessionOptions().cookieName).toBe('fbr_session');
  });
});
