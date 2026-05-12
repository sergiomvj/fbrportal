import { createSupabaseServerClient } from '../supabase-admin';
import type { MktJobCategory, MktProcessingJob, MktJobStatus } from './types';

export interface MktQueueJob {
  id: string;
  category: MktJobCategory;
  estrategiaId: string;
  empresaId: string;
  payload: Record<string, unknown>;
  status: MktJobStatus;
  tentativas: number;
  maxTentativas: number;
  erroMensagem: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  failedAt: string | null;
}

export interface MktQueueConfig {
  attempts: number;
  backoff: { type: 'exponential'; delay: number };
  removeOnComplete: { age: number };
  removeOnFail: { age: number };
}

export const MKT_QUEUE_NAMES = [
  'mkt:upload',
  'mkt:estrategia',
  'mkt:copy',
  'mkt:calendario',
  'mkt:export',
] as const;

export type MktQueueName = (typeof MKT_QUEUE_NAMES)[number];

export const MKT_DEFAULT_JOB_CONFIG: MktQueueConfig = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
  removeOnComplete: { age: 86400 },
  removeOnFail: { age: 604800 },
};

const CATEGORY_TO_QUEUE: Record<MktJobCategory, MktQueueName> = {
  upload: 'mkt:upload',
  extracao: 'mkt:upload',
  geracao_estrategia: 'mkt:estrategia',
  copy: 'mkt:copy',
  calendario: 'mkt:calendario',
  export: 'mkt:export',
};

export function getQueueForCategory(category: MktJobCategory): MktQueueName {
  return CATEGORY_TO_QUEUE[category];
}

type JobProcessor = (job: MktQueueJob) => Promise<void>;

const processors = new Map<MktQueueName, JobProcessor>();

export function registerProcessor(queueName: MktQueueName, processor: JobProcessor) {
  processors.set(queueName, processor);
}

export async function enqueueJob(
  category: MktJobCategory,
  estrategiaId: string,
  empresaId: string,
  payload: Record<string, unknown> = {},
): Promise<MktQueueJob> {
  const supabase = createSupabaseServerClient();
  
  const insertPayload = {
    categoria: category,
    estrategia_id: estrategiaId,
    empresa_id: empresaId,
    payload,
    status: 'pending',
    max_tentativas: MKT_DEFAULT_JOB_CONFIG.attempts,
    tentativas: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from('mkt_processing_jobs').insert(insertPayload).select().single();
  if (error) throw new Error(error.message);
  
  return convertToQueueJob(data as MktProcessingJob);
}

export async function getJob(jobId: string): Promise<MktQueueJob | null> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.from('mkt_processing_jobs').select('*').eq('id', jobId).maybeSingle();
  if (!data) return null;
  return convertToQueueJob(data as MktProcessingJob);
}

export async function getJobsByEstrategia(estrategiaId: string): Promise<MktQueueJob[]> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.from('mkt_processing_jobs').select('*').eq('estrategia_id', estrategiaId);
  if (!data) return [];
  return data.map((row) => convertToQueueJob(row as MktProcessingJob));
}

export async function getQueueStatus(): Promise<Record<MktQueueName, { pending: number; processing: number; done: number; failed: number }>> {
  const status = {} as Record<MktQueueName, { pending: number; processing: number; done: number; failed: number }>;
  for (const name of MKT_QUEUE_NAMES) {
    status[name] = { pending: 0, processing: 0, done: 0, failed: 0 };
  }
  
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.from('mkt_processing_jobs').select('categoria, status');
  if (data) {
    for (const row of data) {
      const qname = getQueueForCategory(row.categoria as MktJobCategory);
      if (qname && status[qname] && status[qname][row.status as keyof typeof status[typeof qname]] !== undefined) {
        status[qname][row.status as keyof typeof status[typeof qname]]++;
      }
    }
  }
  
  return status;
}

export function resetQueuesForTests() {
  // DB persistent
}

function convertToQueueJob(job: MktProcessingJob): MktQueueJob {
  return {
    id: job.id!,
    category: job.categoria,
    estrategiaId: job.estrategia_id!,
    empresaId: job.empresa_id!,
    payload: job.payload as Record<string, unknown>,
    status: job.status,
    tentativas: job.tentativas,
    maxTentativas: job.max_tentativas,
    erroMensagem: job.erro_mensagem ?? null,
    createdAt: job.created_at ?? new Date().toISOString(),
    startedAt: job.started_at ?? null,
    completedAt: job.completed_at ?? null,
    failedAt: job.failed_at ?? null,
  };
}

export function convertToProcessingJob(job: MktQueueJob): MktProcessingJob {
  return {
    id: job.id,
    empresa_id: job.empresaId,
    estrategia_id: job.estrategiaId,
    categoria: job.category,
    status: job.status,
    tentativas: job.tentativas,
    max_tentativas: job.maxTentativas,
    erro_mensagem: job.erroMensagem,
    payload: job.payload,
    started_at: job.startedAt,
    completed_at: job.completedAt,
    failed_at: job.failedAt,
    created_at: job.createdAt,
    updated_at: job.completedAt ?? job.failedAt ?? job.startedAt ?? job.createdAt,
  };
}
