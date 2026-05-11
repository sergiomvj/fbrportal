import { contextOrResponse, jsonError } from '../../../_shared';
import { saveExport, listExportsByEstrategia, getEstrategia, listVersoes } from '@/lib/mkt/store';
import { enqueueJob } from '@/lib/mkt/queue';
import { withSecurityHeaders, checkRateLimit, rateLimitHeaders, rateLimitResponse, MKT_RATE_LIMITS } from '@/lib/mkt/security';
import { createSignedDownload, buildExportPath } from '@/lib/mkt/storage';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const { id } = await params;
    const exportsData = await listExportsByEstrategia(id, context);
    return withSecurityHeaders(Response.json({ exports: exportsData }));
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  const rl = checkRateLimit(`export:${context.companyId}`, MKT_RATE_LIMITS.export ?? { windowMs: 60_000, maxRequests: 10 });
  if (!rl.allowed) return rateLimitResponse(rl);

  try {
    const { id } = await params;
    const estrategia = await getEstrategia(id, context);
    const body = await request.json();
    const { formato } = body as { formato?: 'pdf' | 'pptx' };

    if (!formato || !['pdf', 'pptx'].includes(formato)) {
      return Response.json({ code: 'BAD_REQUEST', message: 'Formato must be pdf or pptx.' }, { status: 400 });
    }

    const versoesData = await listVersoes(id, context);
    const currentVersao = versoesData[0]?.versao ?? estrategia.versao;

    const filePath = buildExportPath(context.companyId, id, formato);
    const signed = createSignedDownload(filePath);

    const exp = await saveExport({
      estrategia_id: id,
      versao: currentVersao,
      formato,
      status: 'pending',
      file_path: filePath,
      signed_url: signed.url,
      signed_url_expires_at: signed.expiresAt,
    });

    await enqueueJob('export', id, context.companyId, {
      export_id: exp.id,
      formato,
      file_path: filePath,
    });

    const resp = Response.json({ export: exp }, { status: 201 });
    const headers = rateLimitHeaders(rl);
    for (const [k, v] of Object.entries(headers)) resp.headers.set(k, v);
    return withSecurityHeaders(resp);
  } catch (error) {
    return jsonError(error);
  }
}
