import { describe, expect, it } from 'vitest';
import { parseEnv } from './env';

const validEnv = {
  SESSION_SECRET: 'a'.repeat(32),
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'anon-key',
  NEXTAUTH_URL: 'http://localhost:3000',
  OPENCLAW_GATEWAY_URL: 'http://localhost:8000',
  OPENROUTER_API_KEY: 'test-openrouter-key',
  OPENROUTER_MODEL: 'anthropic/claude-opus-4.7-fast',
  OPENROUTER_BASE_URL: 'https://openrouter.ai/api/v1',
};

describe('parseEnv', () => {
  it('accepts a complete portal environment', () => {
    expect(parseEnv(validEnv).SESSION_SECRET).toHaveLength(32);
  });

  it('rejects missing SESSION_SECRET', () => {
    expect(() => parseEnv({ ...validEnv, SESSION_SECRET: undefined })).toThrow();
  });

  it('rejects 31-char SESSION_SECRET', () => {
    expect(() => parseEnv({ ...validEnv, SESSION_SECRET: 'a'.repeat(31) })).toThrow();
  });

  it('rejects malformed SUPABASE_URL', () => {
    expect(() => parseEnv({ ...validEnv, SUPABASE_URL: 'not-a-url' })).toThrow();
  });
});
