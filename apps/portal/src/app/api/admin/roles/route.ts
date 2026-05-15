import { NextRequest, NextResponse } from 'next/server';
import { contextFromHeaders, listRolesDb, listPermissionsDb, assignRoleDb, removeRoleDb } from '@/lib/rbac/store-db';

export async function GET(request: NextRequest) {
  const context = contextFromHeaders(request.headers);
  if (context instanceof Response) return context;

  try {
    const [roles, permissions] = await Promise.all([
      listRolesDb(context),
      listPermissionsDb(context),
    ]);

    return NextResponse.json({ roles, permissions });
  } catch (error) {
    return NextResponse.json({ error: { code: 'FETCH_FAILED', message: error instanceof Error ? error.message : 'Erro ao buscar dados' } }, { status: 500 });
  }
}