import { withSession } from '@fbr/auth';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@fbr/auth';
import { getCallbackUrl, isProtectedRoute } from './lib/matcher';

export async function middleware(request: NextRequest) {
  if (!isProtectedRoute(request.nextUrl.pathname)) {
    if (request.nextUrl.pathname === '/login') {
      const response = NextResponse.next();
      const session = await getSessionFromRequest(request, response);

      if (session) {
        return NextResponse.redirect(new URL('/', request.url));
      }

      return response;
    }

    return NextResponse.next();
  }

  const response = await withSession(request);

  if (response.headers.get('location')?.includes('/login')) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', getCallbackUrl(request));
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
