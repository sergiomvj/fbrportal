import { describe, expect, it } from 'vitest';
import { loginSchema } from './auth';

describe('loginSchema', () => {
  it('accepts valid credentials shape', () => {
    expect(loginSchema.safeParse({ email: 'user@example.com', password: 'secret' }).success).toBe(
      true,
    );
  });

  it('rejects invalid email and empty password', () => {
    expect(loginSchema.safeParse({ email: 'bad', password: '' }).success).toBe(false);
  });
});
