import { NextRequest, NextResponse } from 'next/server';
import { contextFromHeaders, getUserDb, updateUserDb, deleteUserDb } from '@/lib/rbac/store-db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = contextFromHeaders(request.headers);
  if (context instanceof Response) return context;

  const { id } = await params;

  try {
    const user = await getUserDb(context, id);
    return NextResponse.json({ user });
  } catch (error) {
    const status = error instanceof Error && error.message.includes('não encontrado') ? 404 : 500;
    return NextResponse.json({ error: { code: 'FETCH_FAILED', message: error instanceof Error ? error.message : 'Erro ao buscar usuário' } }, { status });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = contextFromHeaders(request.headers);
  if (context instanceof Response) return context;

  if (context.role !== 'admin' && context.role !== 'owner') {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Acesso negado' } }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const user = await updateUserDb(context, id, body);
    return NextResponse.json({ user });
  } catch (error) {
    const status = error instanceof Error && error.message.includes('não encontrado') ? 404 : 500;
    return NextResponse.json({ error: { code: 'UPDATE_FAILED', message: error instanceof Error ? error.message : 'Erro ao atualizar usuário' } }, { status });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = contextFromHeaders(request.headers);
  if (context instanceof Response) return context;

  if (context.role !== 'admin' && context.role !== 'owner') {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Acesso negado' } }, { status: 403 });
  }

  const { id } = await params;

  try {
    await deleteUserDb(context, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: { code: 'DELETE_FAILED', message: error instanceof Error ? error.message : 'Erro ao excluir usuário' } }, { status: 500 });
  }
}