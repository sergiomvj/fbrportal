import { jsonError } from '../_shared';
import { createSupabaseServerClient } from '@/lib/supabase-admin';
import { withSecurityHeaders } from '@/lib/mkt/security';
import type { MktProcessingJob } from '@/lib/mkt/types';
import { buildMktNextAttemptAt, isMktJobReadyForProcessing, MKT_DEFAULT_JOB_CONFIG } from '@/lib/mkt/queue';
import { processExtraction } from '@/lib/mkt/workers/extrator';
import { processEstrategia } from '@/lib/mkt/workers/estrategista';
import { processCopy } from '@/lib/mkt/workers/copy';
import { processCalendario } from '@/lib/mkt/workers/calendario';
import {
  getBranding,
  getDiagnosticoByEstrategia,
  getEstrategia,
  listCalendarByEstrategia,
  listCopyByEstrategia,
  listLeadMagnetsByEstrategia,
  listRoadmapByEstrategia,
  listVersoes,
} from '@/lib/mkt/store';
import {
  buildStrategyExportedEvent,
  emitStrategyExportedEvent,
  generateMktPdfBuffer,
  generateMktPptxBuffer,
  resolveClickBridgeEndpoint,
  type StrategyExportedEvent,
} from '@/lib/mkt/export';
import { bucketForStoragePath } from '@/lib/mkt/storage';

type ExportJobPayload = {
  export_id?: string;
  file_path: string;
  formato: 'pdf' | 'pptx';
  exportado_por?: string;
};

type ClickDeliveryJobPayload = {
  export_id?: string;
  event: StrategyExportedEvent;
  exportado_por?: string;
  previous_error?: string;
};

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'dev-secret'}` && process.env.NODE_ENV !== 'development') {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createSupabaseServerClient();
    const nowIso = new Date().toISOString();
    const { data: jobs, error } = await supabase
      .from('mkt_processing_jobs')
      .select('*')
      .eq('status', 'pending')
      .or(`next_attempt_at.is.null,next_attempt_at.lte.${nowIso}`)
      .order('created_at', { ascending: true })
      .limit(5);

    if (error) throw new Error(error.message);
    if (!jobs || jobs.length === 0) {
      return withSecurityHeaders(Response.json({ message: 'No pending jobs', processed: 0 }));
    }

    const processedIds = [];

    for (const job of jobs) {
      const typedJob = job as MktProcessingJob;
      if (!isMktJobReadyForProcessing(typedJob)) continue;

      const claimed = await claimPendingJobForProcessing(typedJob);
      if (!claimed) continue;

      try {
        if (typedJob.categoria === 'export') {
          await processExportJob(typedJob, resolveClickBridgeEndpoint(undefined, request.url));
        } else if (typedJob.categoria === 'fbr_click_delivery') {
          await processClickDeliveryJob(typedJob, resolveClickBridgeEndpoint(undefined, request.url));
        } else if (typedJob.categoria === 'extracao') {
          await processExtraction(typedJob, { companyId: typedJob.empresa_id, userId: 'worker', moduleSource: 'worker' });
        } else if (typedJob.categoria === 'geracao_estrategia') {
          await processEstrategia(typedJob, { companyId: typedJob.empresa_id, userId: 'worker', moduleSource: 'worker' });
        } else if (typedJob.categoria === 'copy') {
          await processCopy(typedJob, { companyId: typedJob.empresa_id, userId: 'worker', moduleSource: 'worker' });
        } else if (typedJob.categoria === 'calendario') {
          await processCalendario(typedJob, { companyId: typedJob.empresa_id, userId: 'worker', moduleSource: 'worker' });
        }

        await supabase
          .from('mkt_processing_jobs')
          .update({
            status: 'done',
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', typedJob.id);

        processedIds.push(typedJob.id);
      } catch (err) {
        const erroMensagem = err instanceof Error ? err.message : 'Unknown error';
        const failedTerminally = typedJob.tentativas + 1 >= (typedJob.max_tentativas || MKT_DEFAULT_JOB_CONFIG.attempts);
        await supabase.from('mkt_processing_jobs').update({
          erro_mensagem: erroMensagem,
          failed_at: new Date().toISOString(),
          next_attempt_at: failedTerminally ? null : buildMktNextAttemptAt(typedJob.tentativas + 1),
          status: failedTerminally ? 'failed' : 'pending',
          updated_at: new Date().toISOString(),
        }).eq('id', typedJob.id);

        if (typedJob.categoria === 'export' && failedTerminally) {
          const payload = typedJob.payload as Partial<ExportJobPayload> | undefined;
          if (payload?.export_id) {
            await supabase.from('mkt_exports').update({ status: 'failed' }).eq('id', payload.export_id);
          }
        }
      }
    }

    return withSecurityHeaders(Response.json({ message: 'Processed jobs', processed: processedIds.length, ids: processedIds }));
  } catch (error) {
    return jsonError(error);
  }
}

async function claimPendingJobForProcessing(job: MktProcessingJob): Promise<boolean> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('mkt_processing_jobs')
    .update({
      status: 'processing',
      started_at: new Date().toISOString(),
      failed_at: null,
      erro_mensagem: null,
      tentativas: job.tentativas + 1,
      next_attempt_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', job.id)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle();

  if (error) throw new Error(error.message);
  return Boolean(data);
}

async function processExportJob(job: MktProcessingJob, clickBridgeEndpoint: string | null) {
  const supabase = createSupabaseServerClient();
  const { export_id, file_path, formato, exportado_por } = job.payload as ExportJobPayload;
  const context = {
    companyId: job.empresa_id,
    userId: exportado_por ?? job.empresa_id,
    moduleSource: 'fbr-mkt',
  };

  if (export_id) {
    await supabase.from('mkt_exports').update({ status: 'processing' }).eq('id', export_id);
  }

  const estrategia = await getEstrategia(job.estrategia_id, context);
  const versoes = await listVersoes(job.estrategia_id, context);
  const versao = versoes[0];
  if (!versao) throw new Error('No approved strategy version available for export.');

  const bundle = {
    estrategia,
    versao,
    diagnostico: await getDiagnosticoByEstrategia(job.estrategia_id, context),
    copy: await listCopyByEstrategia(job.estrategia_id, context),
    leadMagnets: await listLeadMagnetsByEstrategia(job.estrategia_id, context),
    calendario: await listCalendarByEstrategia(job.estrategia_id, context),
    roadmap: await listRoadmapByEstrategia(job.estrategia_id, context),
    branding: await getBranding(context),
  };

  const buffer = formato === 'pdf' ? await generateMktPdfBuffer(bundle) : generateMktPptxBuffer(bundle);

  await supabase.storage.from(bucketForStoragePath(file_path)).upload(file_path, buffer, {
    contentType: formato === 'pdf'
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    upsert: true,
  });

  const event = buildStrategyExportedEvent(bundle, context.userId);
  const bridgeResult = await emitStrategyExportedEvent(event, context, clickBridgeEndpoint);
  if (bridgeResult.status === 'failed') {
    await enqueueClickDeliveryRetry(job, event, bridgeResult, export_id);
  }

  if (export_id) {
    await supabase.from('mkt_exports').update({
      status: 'done',
      file_size_bytes: buffer.length,
      completed_at: new Date().toISOString(),
    }).eq('id', export_id);
  }
}

async function processClickDeliveryJob(job: MktProcessingJob, clickBridgeEndpoint: string | null) {
  const payload = job.payload as ClickDeliveryJobPayload;
  if (!payload.event) throw new Error('Missing strategy.exported event payload for Click delivery.');

  const bridgeResult = await emitStrategyExportedEvent(
    payload.event,
    {
      companyId: job.empresa_id,
      userId: payload.exportado_por ?? job.empresa_id,
      moduleSource: 'fbr-mkt',
    },
    clickBridgeEndpoint,
  );

  if (bridgeResult.status === 'failed') {
    throw new Error(`strategy.exported delivery failed: ${bridgeResult.message}`);
  }
}

async function enqueueClickDeliveryRetry(
  sourceJob: MktProcessingJob,
  event: StrategyExportedEvent,
  bridgeResult: { status: 'failed'; statusCode?: number; message: string },
  exportId?: string,
) {
  const supabase = createSupabaseServerClient();
  await supabase.from('mkt_processing_jobs').insert({
    empresa_id: sourceJob.empresa_id,
    estrategia_id: sourceJob.estrategia_id,
    categoria: 'fbr_click_delivery',
    status: 'pending',
    tentativas: 0,
    max_tentativas: MKT_DEFAULT_JOB_CONFIG.attempts,
    next_attempt_at: buildMktNextAttemptAt(1),
    payload: {
      export_id: exportId,
      event,
      exportado_por: event.data.exportado_por,
      previous_error: bridgeResult.message,
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
}
