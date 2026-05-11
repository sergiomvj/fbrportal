import { createEstrategia, listEstrategias, parseEstrategiasQuery } from '@/lib/mkt/store';
import { contextOrResponse, jsonError } from '../_shared';
import { checkRateLimit, rateLimitHeaders, rateLimitResponse, withSecurityHeaders, MKT_RATE_LIMITS } from '@/lib/mkt/security';
import { enqueueJob } from '@/lib/mkt/queue';

export async function GET(request: Request) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const result = listEstrategias(context, parseEstrategiasQuery(request.url));
    return withSecurityHeaders(Response.json({ estrategias: result.items, pagination: result.pagination }));
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  const rl = checkRateLimit(`estrategias:${context.companyId}`, MKT_RATE_LIMITS.estrategias ?? { windowMs: 60_000, maxRequests: 30 });
  if (!rl.allowed) return rateLimitResponse(rl);

  try {
    const body = await request.json();
    const estrategia = createEstrategia(context, body);

    await enqueueJob('extracao', estrategia.id!, context.companyId, {
      nome: estrategia.nome,
      nicho: estrategia.nicho,
      doc_path: estrategia.doc_path,
    });

    const resp = Response.json({ estrategia }, { status: 201 });
    const headers = rateLimitHeaders(rl);
    for (const [k, v] of Object.entries(headers)) resp.headers.set(k, v);
    return withSecurityHeaders(resp);
  } catch (error) {
    return jsonError(error);
  }
}
