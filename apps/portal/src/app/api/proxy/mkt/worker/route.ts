import { jsonError } from '../_shared';
import { createSupabaseServerClient } from '@/lib/supabase-admin';
import { withSecurityHeaders } from '@/lib/mkt/security';
import type { MktProcessingJob } from '@/lib/mkt/types';
import { MKT_DEFAULT_JOB_CONFIG } from '@/lib/mkt/queue';
import { processExtraction } from '@/lib/mkt/workers/extrator';
import { processEstrategia } from '@/lib/mkt/workers/estrategista';
import { processCopy } from '@/lib/mkt/workers/copy';
import { processCalendario } from '@/lib/mkt/workers/calendario';
import { PDFDocument, rgb } from 'pdf-lib';

type ExportJobPayload = {
  file_path: string;
  formato: 'pdf' | 'pptx';
};

type StrategyVersionPayload = {
  canais?: string[];
};

export async function POST(request: Request) {
  // This endpoint can be triggered by a CRON job or manually to process pending jobs
  // For security, you might want to add a cron secret check here.
  const authHeader = request.headers.get('authorization');
  // Simple check for internal cron or token
  if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'dev-secret'}` && process.env.NODE_ENV !== 'development') {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createSupabaseServerClient();
    
    // Fetch up to 5 pending jobs
    const { data: jobs, error } = await supabase
      .from('mkt_processing_jobs')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(5);
      
    if (error) throw new Error(error.message);
    if (!jobs || jobs.length === 0) {
      return withSecurityHeaders(Response.json({ message: 'No pending jobs', processed: 0 }));
    }

    const processedIds = [];

    for (const job of jobs) {
      const typedJob = job as MktProcessingJob;
      // Mark as processing
      await supabase.from('mkt_processing_jobs')
        .update({ status: 'processing', started_at: new Date().toISOString(), tentativas: typedJob.tentativas + 1 })
        .eq('id', typedJob.id);

      try {
        if (typedJob.categoria === 'export') {
          const { file_path, formato } = typedJob.payload as ExportJobPayload;
          
          let buffer: Buffer;
          if (formato === 'pdf') {
            const pdfDoc = await PDFDocument.create();
            const page = pdfDoc.addPage();
            page.drawText('FBR-MKT: Relatório Estratégico', { x: 50, y: 700, size: 24, color: rgb(0, 0, 0) });
            page.drawText(`Gerado em: ${new Date().toLocaleDateString()}`, { x: 50, y: 670, size: 12 });
            const pdfBytes = await pdfDoc.save();
            buffer = Buffer.from(pdfBytes);
          } else {
            buffer = Buffer.from(`Simulated ${formato} export content`);
          }

          await supabase.storage.from('mkt_documents').upload(file_path, buffer, {
            contentType: formato === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            upsert: true,
          });

          // Trigger FBR-Click webhook or event
          try {
            const { data: estData } = await supabase.from('mkt_estrategias').select('nome, nicho, doc_path').eq('id', typedJob.estrategia_id).single();
            const { data: diagData } = await supabase.from('mkt_diagnosticos').select('score_viab').eq('estrategia_id', typedJob.estrategia_id).single();
            const { data: verData } = await supabase.from('mkt_estrategia_versoes').select('conteudo').eq('estrategia_id', typedJob.estrategia_id).order('versao', { ascending: false }).limit(1).single();
            
            const eventPayload = { 
              event: 'strategy.exported', 
              data: {
                estrategia_id: typedJob.estrategia_id,
                nome: estData?.nome || 'Estratégia sem nome',
                nicho: estData?.nicho || 'Geral',
                documento_original: estData?.doc_path || null,
                score_viabilidade: diagData?.score_viab || 0,
                canais_sugeridos: verData?.conteudo
                  ? ((verData.conteudo as StrategyVersionPayload).canais ?? [])
                  : []
              },
              company_id: typedJob.empresa_id 
            };
            
            console.log('[FBR-MKT] Emitting strategy.exported to Click module (simulated)', eventPayload);
            // await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/proxy/click/deals/events`, { ... });
          } catch (e) {
            console.error('Failed to emit strategy.exported event', e);
          }
        } else if (typedJob.categoria === 'extracao') {
          await processExtraction(typedJob, { companyId: typedJob.empresa_id, userId: 'worker', moduleSource: 'worker' });
        } else if (typedJob.categoria === 'geracao_estrategia') {
          await processEstrategia(typedJob, { companyId: typedJob.empresa_id, userId: 'worker', moduleSource: 'worker' });
        } else if (typedJob.categoria === 'copy') {
          await processCopy(typedJob, { companyId: typedJob.empresa_id, userId: 'worker', moduleSource: 'worker' });
        } else if (typedJob.categoria === 'calendario') {
          await processCalendario(typedJob, { companyId: typedJob.empresa_id, userId: 'worker', moduleSource: 'worker' });
        } else {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        
        // Mark as done
        await supabase.from('mkt_processing_jobs')
          .update({ status: 'done', completed_at: new Date().toISOString() })
          .eq('id', typedJob.id);
          
        processedIds.push(typedJob.id);
      } catch (err) {
        const erroMensagem = err instanceof Error ? err.message : 'Unknown error';
        const failPayload = {
          erro_mensagem: erroMensagem,
          failed_at: new Date().toISOString(),
          status: typedJob.tentativas + 1 >= (typedJob.max_tentativas || MKT_DEFAULT_JOB_CONFIG.attempts) ? 'failed' : 'pending'
        };
        await supabase.from('mkt_processing_jobs').update(failPayload).eq('id', typedJob.id);
      }
    }

    return withSecurityHeaders(Response.json({ message: 'Processed jobs', processed: processedIds.length, ids: processedIds }));
  } catch (error) {
    return jsonError(error);
  }
}
