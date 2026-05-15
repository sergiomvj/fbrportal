import { NextRequest, NextResponse } from 'next/server';
import { getMktRequestContext } from '@/lib/mkt/context';
import { createSupabaseServerClient } from '@/lib/supabase-admin';
import type { ProjectMarketingData } from '@/lib/mkt/importer';
import { generateReportOutputs } from '@/lib/mkt/workers/report-outputs';
import { enqueueJob } from '@/lib/mkt/queue';
import { emitGeracao } from '@/lib/mkt/sse';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await getMktRequestContext(request);
  if (context instanceof Response) return context;

  const { id: estrategiaId } = await params;

  const body = await request.json().catch(() => ({}));
  const projectId = body.project_id as string | undefined;

  if (!projectId) {
    return NextResponse.json(
      { error: { code: 'MISSING_PROJECT_ID', message: 'project_id é obrigatório para gerar outputs do report.' } },
      { status: 400 }
    );
  }

  const supabase = createSupabaseServerClient();
  const { data: project, error: pError } = await supabase
    .from('projects')
    .select('name, metadata')
    .eq('id', projectId)
    .single();

  if (pError || !project) {
    return NextResponse.json(
      { error: { code: 'PROJECT_NOT_FOUND', message: 'Projeto não encontrado.' } },
      { status: 404 }
    );
  }

  const metadata = project.metadata as unknown as ProjectMarketingData;
  if (!metadata.marketing_strategy) {
    return NextResponse.json(
      { error: { code: 'NO_STRATEGY', message: 'O projeto não possui marketing_strategy no metadata.' } },
      { status: 422 }
    );
  }

  const job = await enqueueJob(
    'report_outputs',
    estrategiaId,
    context.companyId,
    { project_id: projectId },
  );

  generateReportOutputs(metadata, projectId)
    .then(async (outputs) => {
      const { error: saveError } = await supabase
        .from('mkt_estrategia_versoes')
        .update({
          conteudo: {
            report_outputs: outputs,
            generated_at: new Date().toISOString(),
            project_id: projectId,
          },
        })
        .eq('estrategia_id', estrategiaId)
        .eq('versao', body.versao ?? 1);

      if (saveError) {
        console.error('[report-outputs] Failed to save outputs:', saveError.message);
      }

      await supabase
        .from('mkt_processing_jobs')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', job.id);

      emitGeracao(estrategiaId, 100, 'Outputs do report gerados com sucesso');
    })
    .catch(async (err) => {
      console.error('[report-outputs] Generation failed:', err);
      await supabase
        .from('mkt_processing_jobs')
        .update({
          status: 'failed',
          error: err instanceof Error ? err.message : 'Erro desconhecido',
          next_attempt_at: new Date(Date.now() + 5000).toISOString(),
        })
        .eq('id', job.id);

      emitGeracao(estrategiaId, 0, 'Falha ao gerar outputs do report');
    });

  return NextResponse.json(
    {
      status: 'processing',
      job_id: job.id,
      message: 'Geração de outputs do report iniciada. Acompanhe via SSE.',
    },
    { status: 202 }
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await getMktRequestContext(request);
  if (context instanceof Response) return context;

  const { id: estrategiaId } = await params;
  const supabase = createSupabaseServerClient();

  const url = new URL(request.url);
  const versao = parseInt(url.searchParams.get('versao') || '1');

  const { data, error } = await supabase
    .from('mkt_estrategia_versoes')
    .select('conteudo')
    .eq('estrategia_id', estrategiaId)
    .eq('empresa_id', context.companyId)
    .eq('versao', versao)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Versão da estratégia não encontrada.' } },
      { status: 404 }
    );
  }

  const conteudo = data.conteudo as Record<string, unknown>;
  if (!conteudo.report_outputs) {
    return NextResponse.json(
      { error: { code: 'NO_OUTPUTS', message: 'Outputs do report ainda não foram gerados para esta versão.' } },
      { status: 404 }
    );
  }

  return NextResponse.json({ outputs: conteudo.report_outputs });
}