import { getIronSession } from 'iron-session';
import { NextResponse, type NextRequest } from 'next/server';
import { createSessionOptions } from '@fbr/auth';
import type { SessionData } from '@fbr/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { createSupabaseServerClient } from '@/lib/supabase-admin';
import { loginSchema } from '@/lib/validators/auth';

const genericError = 'Credenciais invalidas.';

function shouldLogAuthDebug(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.VITEST !== 'true';
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(`auth:${getClientIp(request)}`);

  if (!rateLimit.allowed) {
    return NextResponse.json({ error: genericError }, { status: 429 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: genericError }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: genericError }, { status: 400 });
  }

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

    if (error || !data.user) {
      if (shouldLogAuthDebug()) {
        console.warn('[auth/login] Supabase sign-in failed', {
          code: error?.code,
          status: error?.status,
          message: error?.message,
        });
      }

      return NextResponse.json({ error: genericError }, { status: 401 });
    }

    const role =
      typeof data.user.user_metadata.role === 'string'
        ? data.user.user_metadata.role
        : 'operator';
    const empresaId =
      typeof data.user.user_metadata.empresaId === 'string'
        ? data.user.user_metadata.empresaId
        : 'default';

    const sessionUser: SessionData = {
      userId: data.user.id,
      email: data.user.email ?? parsed.data.email,
      role,
      empresaId,
    };

    const response = NextResponse.json({ success: true });
    const session = await getIronSession<{ user?: SessionData }>(
      request,
      response,
      createSessionOptions(),
    );
    session.user = sessionUser;
    await session.save();

    return response;
  } catch (error) {
    if (shouldLogAuthDebug()) {
      console.warn('[auth/login] Unexpected sign-in failure', {
        message: error instanceof Error ? error.message : 'unknown error',
      });
    }

    return NextResponse.json({ error: genericError }, { status: 401 });
  }
}
