import type { NextRequest } from 'next/server';

const PUBLIC_FILE = /\.(.*)$/;

export function isAuthRoute(pathname: string): boolean {
  return pathname.startsWith('/api/auth/');
}

export function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    PUBLIC_FILE.test(pathname)
  );
}

export function isProtectedRoute(pathname: string): boolean {
  return pathname !== '/login' && !isAuthRoute(pathname) && !isStaticAsset(pathname);
}

export function getCallbackUrl(request: NextRequest): string {
  return `${request.nextUrl.pathname}${request.nextUrl.search}`;
}
