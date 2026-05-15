import { NextRequest, NextResponse } from 'next/server';
import { contextFromHeaders, listUsersDb, createUserDb, getUserDb, updateUserDb, deleteUserDb } from '@/lib/rbac/store-db';

export async function GET(request: NextRequest) {
  const context = contextFromHeaders(request.headers);
  if (context instanceof Response) return context;

  try {
    const users = await listUsersDb(context);
    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ error: { code: 'FETCH_FAILED', message: error instanceof Error ? error.message : 'Erro ao buscar usuários' } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const context = contextFromHeaders(request.headers);
  if (context instanceof Response) return context;

  if (context.role !== 'admin' && context.role !== 'owner') {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Acesso negado' } }, { status: 403 });
  }

  try {
    const body = await request.json();
    const user = await createUserDb(context, body);
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: { code: 'CREATE_FAILED', message: error instanceof Error ? error.message : 'Erro ao criar usuário' } }, { status: 500 });
  }
}