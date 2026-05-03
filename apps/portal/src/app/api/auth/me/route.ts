import { getSession } from '@fbr/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ user: null, error: 'Unauthorized.' }, { status: 401 });
  }

  const { email, role, empresaId } = session;

  return NextResponse.json({
    user: {
      email,
      role,
      empresaId,
    },
    error: null,
  });
}
