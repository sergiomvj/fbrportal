import { listAlertas, resolveAlerta, resolveAllAlertas } from '@/lib/redacao/store';
import { contextOrResponse, jsonError } from '../_shared';

export async function GET(request: Request) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const url = new URL(request.url);
    const filters: Record<string, string | boolean> = {};
    if (url.searchParams.get('nivel')) filters.nivel = url.searchParams.get('nivel')!;
    if (url.searchParams.get('tipo')) filters.tipo = url.searchParams.get('tipo')!;
    if (url.searchParams.get('resolvido') !== null) filters.resolvido = url.searchParams.get('resolvido') === 'true';
    return Response.json({ alertas: listAlertas(context, filters) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const body = await request.json();
    if (body.action === 'resolve_all') {
      return Response.json({ resolved: resolveAllAlertas(context) });
    }
    const id = body.id as string;
    if (!id) return Response.json({ code: 'BAD_REQUEST', message: 'id is required.' }, { status: 400 });
    return Response.json({ alerta: resolveAlerta(context, id) });
  } catch (error) {
    return jsonError(error);
  }
}
