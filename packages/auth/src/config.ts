import type { SessionOptions } from 'iron-session';

export const sessionCookieName = 'fbr_session';

export function getSessionPassword(): string {
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET must contain at least 32 characters.');
  }

  return secret;
}

export function createSessionOptions(): SessionOptions {
  return {
    password: getSessionPassword(),
    cookieName: sessionCookieName,
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    },
  };
}
