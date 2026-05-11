import { listUGC, createUGC, aceitarUGC, rejeitarUGC } from '@/lib/redacao/store';
import { contextOrResponse, jsonError } from '../_shared';

export async function GET(request: Request) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status') ?? undefined;
    return Response.json({ ugc: listUGC(context, status) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const body = await request.json();
    if (body.action === 'aceitar' && body.id) {
      return Response.json({ ugc: aceitarUGC(context, body.id) });
    }
    if (body.action === 'rejeitar' && body.id) {
      return Response.json({ ugc: rejeitarUGC(context, body.id, body.motivo ?? 'Sem motivo') });
    }
    return Response.json({ ugc: createUGC(context, body) }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
