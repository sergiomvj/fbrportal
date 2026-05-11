import {
  listReceitas,
  createReceita,
  runReconciliation,
} from '@/lib/sales/store';
import { contextOrResponse, jsonError } from '../_shared';

export async function GET(request: Request) {
  const contextOr = contextOrResponse(request);
  if (contextOr instanceof Response) return contextOr;
  const { userId } = contextOr;
  const companyId = contextOr.companyId;
  const context = { companyId, userId, moduleSource: 'fbr-portal' };

  try {
    const url = new URL(request.url);
    const filters: { status?: string; parceiro_id?: string; periodo?: string } = {};
    const status = url.searchParams.get('status');
    const parceiro_id = url.searchParams.get('parceiro_id');
    const periodo = url.searchParams.get('periodo');
    if (status) filters.status = status;
    if (parceiro_id) filters.parceiro_id = parceiro_id;
    if (periodo) filters.periodo = periodo;
    const receitas = listReceitas(context, filters);
    return Response.json({ receitas });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  const contextOr = contextOrResponse(request);
  if (contextOr instanceof Response) return contextOr;
  const { userId } = contextOr;
  const companyId = contextOr.companyId;
  const context = { companyId, userId, moduleSource: 'fbr-portal' };

  try {
    const url = new URL(request.url);
    if (url.searchParams.get('action') === 'reconciliar') {
      const result = runReconciliation(context);
      return Response.json(result);
    }
    return Response.json({ receita: createReceita(context, await request.json()) }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}