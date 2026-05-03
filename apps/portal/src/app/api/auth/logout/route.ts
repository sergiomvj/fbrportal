import { getIronSession } from 'iron-session';
import { NextResponse, type NextRequest } from 'next/server';
import { createSessionOptions } from '@fbr/auth';
import type { SessionData } from '@fbr/auth';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true });
  const session = await getIronSession<{ user?: SessionData }>(
    request,
    response,
    createSessionOptions(),
  );

  session.destroy();

  return response;
}
