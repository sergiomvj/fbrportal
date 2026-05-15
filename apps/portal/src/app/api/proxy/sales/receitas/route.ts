import {
  listReceitas,
  createReceita,
  buildPaymentReceivedForward,
  emitPaymentReceivedEvent,
  runReconciliation,
} from '@/lib/sales/store';
import { contextOrResponse, jsonError, jsonSuccess } from '../_shared';

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
    return jsonSuccess(receitas);
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
    const body = await request.json().catch(() => ({}));
    if (url.searchParams.get('action') === 'reconciliar') {
      return jsonSuccess(runReconciliation(context));
    }
    if (url.searchParams.get('action') === 'forward_finance') {
      const event = buildPaymentReceivedForward(context, String((body as { receita_id?: string }).receita_id));
      const delivery = await emitPaymentReceivedEvent(event, context);
      return jsonSuccess({ event, delivery });
    }
    return jsonSuccess(createReceita(context, body), { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
