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
    let fileToUpload: File | null = null;
    let ext = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      body.nome = formData.get('nome');
      body.nicho = formData.get('nicho');
      
      const file = formData.get('file') as File | null;
      if (file) {
        fileToUpload = file;
        ext = file.name.split('.').pop() || '';
      }
    } else {
      body = await request.json();
    }

    // 1. Cria a estrategia primeiro para gerar o ID e garantir RLS
    const estrategia = await createEstrategia(context, body);

    // 2. Se houver arquivo, faz upload no path correto do PRD e atualiza
    if (fileToUpload) {
      const { buildStoragePath } = await import('@/lib/mkt/storage');
      const supabase = createSupabaseServerClient();
      const filePath = buildStoragePath(context.companyId, estrategia.id!, `${crypto.randomUUID()}.${ext}`);
      
      const arrayBuffer = await fileToUpload.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const { error: uploadError } = await supabase.storage.from('mkt_documents').upload(filePath, buffer, {
        contentType: fileToUpload.type,
        upsert: true,
      });
      
      if (uploadError) throw new Error(`Falha no upload: ${uploadError.message}`);
      
      // Atualiza o doc_path na estrategia recem criada
      await supabase.from('mkt_estrategias').update({ doc_path: filePath }).eq('id', estrategia.id);
      estrategia.doc_path = filePath;
    }

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
