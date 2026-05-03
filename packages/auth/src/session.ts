import { getIronSession, type IronSession, type SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';
import type { NextRequest, NextResponse } from 'next/server';
import { createSessionOptions } from './config';
import { sessionDataSchema, type SessionData } from './types';

type FbrIronSession = IronSession<{ user?: SessionData }>;
const getIronSessionFromCookies = getIronSession as unknown as <T extends object>(
  cookieStore: unknown,
  sessionOptions: SessionOptions,
) => Promise<IronSession<T>>;

function readValidSession(session: FbrIronSession): SessionData | null {
  const parsed = sessionDataSchema.safeParse(session.user);
  return parsed.success ? parsed.data : null;
}

export async function getSession(): Promise<SessionData | null> {
  const session = await getIronSessionFromCookies<{ user?: SessionData }>(
    await cookies(),
    createSessionOptions(),
  );

  return readValidSession(session);
}

export async function getMutableSession(): Promise<FbrIronSession> {
  return getIronSessionFromCookies<{ user?: SessionData }>(
    await cookies(),
    createSessionOptions(),
  );
}

export async function getSessionFromRequest(
  request: NextRequest,
  response: NextResponse,
): Promise<SessionData | null> {
  const session = await getIronSession<{ user?: SessionData }>(
    request,
    response,
    createSessionOptions(),
  );

  return readValidSession(session);
}

export async function destroySession(): Promise<void> {
  const session = await getMutableSession();
  session.destroy();
}
