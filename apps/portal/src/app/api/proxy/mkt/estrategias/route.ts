import { createEstrategia, listEstrategias, parseEstrategiasQuery } from '@/lib/mkt/store';
import { contextOrResponse, jsonError } from '../_shared';
import { checkRateLimit, rateLimitHeaders, rateLimitResponse, withSecurityHeaders, MKT_RATE_LIMITS } from '@/lib/mkt/security';
import { enqueueJob } from '@/lib/mkt/queue';
import { createSupabaseServerClient } from '@/lib/supabase-admin';

export async function GET(request: Request) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const result = await listEstrategias(context, parseEstrategiasQuery(request.url));
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
    const contentType = request.headers.get('content-type') || '';
    let body: any = {};
    let docPath = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      body.nome = formData.get('nome');
      body.nicho = formData.get('nicho');
      
      const file = formData.get('file') as File | null;
      if (file) {
        const supabase = createSupabaseServerClient();
        const ext = file.name.split('.').pop();
        const filePath = `${context.companyId}/${crypto.randomUUID()}.${ext}`;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        const { error: uploadError } = await supabase.storage.from('mkt_documents').upload(filePath, buffer, {
          contentType: file.type,
          upsert: true,
        });
        
        if (uploadError) throw new Error(`Falha no upload: ${uploadError.message}`);
        docPath = filePath;
        body.doc_path = docPath;
      }
    } else {
      body = await request.json();
    }

    const estrategia = await createEstrategia(context, body);

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
