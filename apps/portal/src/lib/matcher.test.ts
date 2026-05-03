import { describe, expect, it } from 'vitest';
import { isAuthRoute, isProtectedRoute, isStaticAsset } from './matcher';

describe('route matcher', () => {
  it('exempts login, auth API, and static assets', () => {
    expect(isProtectedRoute('/login')).toBe(false);
    expect(isAuthRoute('/api/auth/login')).toBe(true);
    expect(isProtectedRoute('/api/auth/login')).toBe(false);
    expect(isStaticAsset('/_next/static/chunk.js')).toBe(true);
    expect(isProtectedRoute('/favicon.ico')).toBe(false);
  });

  it('protects portal routes', () => {
    expect(isProtectedRoute('/')).toBe(true);
    expect(isProtectedRoute('/click?tab=settings')).toBe(true);
  });
});
