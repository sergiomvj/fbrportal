import { contextOrResponse, jsonError } from '../_shared';
import { createSupabaseServerClient } from '@/lib/supabase-admin';
import { withSecurityHeaders } from '@/lib/mkt/security';
import type { MktProcessingJob } from '@/lib/mkt/types';
import { MKT_DEFAULT_JOB_CONFIG } from '@/lib/mkt/queue';

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
          const { file_path, formato } = typedJob.payload as { file_path: string, formato: string };
          // Real PDF generation would go here (e.g. using pdf-lib or external API)
          // For now, we simulate the file creation in Supabase Storage
          const buffer = Buffer.from(`Simulated ${formato} export content`);
          await supabase.storage.from('mkt_documents').upload(file_path, buffer, {
            contentType: formato === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            upsert: true,
          });

          // Trigger FBR-Click webhook or event
          try {
            await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/proxy/click/deals/events`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ event: 'strategy.exported', strategy_id: typedJob.estrategia_id, company_id: typedJob.empresa_id })
            });
          } catch (e) {
            console.error('Failed to emit strategy.exported event', e);
          }
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
