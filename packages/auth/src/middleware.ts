import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getSessionFromRequest } from './session';

export async function withSession(request: NextRequest): Promise<NextResponse> {
  const response = NextResponse.next();
  const session = await getSessionFromRequest(request, response);

  if (session) {
    return response;
  }

  const loginUrl = new URL('/login', request.url);
  const callbackUrl = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  loginUrl.searchParams.set('callbackUrl', callbackUrl);

  return NextResponse.redirect(loginUrl);
}
