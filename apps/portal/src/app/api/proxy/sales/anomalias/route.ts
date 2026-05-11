import {
  listAnomalies,
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
    const filters: { tipo?: string; severidade?: string; status?: string } = {};
    const tipo = url.searchParams.get('tipo');
    const severidade = url.searchParams.get('severidade');
    const status = url.searchParams.get('status');
    if (tipo) filters.tipo = tipo;
    if (severidade) filters.severidade = severidade;
    if (status) filters.status = status;
    const anomalias = listAnomalies(context, filters);
    return Response.json({ anomalias });
  } catch (error) {
    return jsonError(error);
  }
}