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
  nextAttemptAt: string | null;
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
  'mkt:fbr_click',
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
  fbr_click_delivery: 'mkt:fbr_click',
  report_outputs: 'mkt:estrategia',
};

export function getQueueForCategory(category: MktJobCategory): MktQueueName {
  return CATEGORY_TO_QUEUE[category];
}

export function getMktRetryDelayMs(attemptNumber: number, config = MKT_DEFAULT_JOB_CONFIG): number {
  const safeAttempt = Math.max(attemptNumber, 1);
  return config.backoff.delay * 2 ** (safeAttempt - 1);
}

export function buildMktNextAttemptAt(attemptNumber: number, now = Date.now()): string {
  return new Date(now + getMktRetryDelayMs(attemptNumber)).toISOString();
}

export function isMktJobReadyForProcessing(job: Pick<MktProcessingJob, 'next_attempt_at'>, now = Date.now()): boolean {
  if (!job.next_attempt_at) return true;
  const nextAttempt = Date.parse(job.next_attempt_at);
  return Number.isNaN(nextAttempt) || nextAttempt <= now;
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
  const supabase = await getSupabaseClient();
  
  const insertPayload = {
    categoria: category,
    estrategia_id: estrategiaId,
    empresa_id: empresaId,
    payload,
    status: 'pending',
    max_tentativas: MKT_DEFAULT_JOB_CONFIG.attempts,
    tentativas: 0,
    next_attempt_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from('mkt_processing_jobs').insert(insertPayload).select().single();
  if (error) throw new Error(error.message);
  
  return convertToQueueJob(data as MktProcessingJob);
}

export async function getJob(jobId: string): Promise<MktQueueJob | null> {
  const supabase = await getSupabaseClient();
  const { data } = await supabase.from('mkt_processing_jobs').select('*').eq('id', jobId).maybeSingle();
  if (!data) return null;
  return convertToQueueJob(data as MktProcessingJob);
}

export async function getJobsByEstrategia(estrategiaId: string, companyId?: string): Promise<MktQueueJob[]> {
  const supabase = await getSupabaseClient();
  let query = supabase.from('mkt_processing_jobs').select('*').eq('estrategia_id', estrategiaId);
  if (companyId) {
    query = query.eq('empresa_id', companyId);
  }
  const { data } = await query;
  if (!data) return [];
  return data.map((row) => convertToQueueJob(row as MktProcessingJob));
}

export type MktQueueStatus = Record<MktQueueName, { pending: number; processing: number; done: number; failed: number }>;

export async function getQueueStatus(companyId?: string): Promise<MktQueueStatus> {
  const supabase = await getSupabaseClient();
  let query = supabase.from('mkt_processing_jobs').select('categoria, status');
  if (companyId) {
    query = query.eq('empresa_id', companyId);
  }

  const { data } = await query;
  return buildQueueStatusFromRows((data as Array<{ categoria: MktJobCategory; status: MktJobStatus }> | null) ?? []);
}

export function buildQueueStatusFromRows(rows: Array<{ categoria: MktJobCategory; status: MktJobStatus }>): MktQueueStatus {
  const status = {} as Record<MktQueueName, { pending: number; processing: number; done: number; failed: number }>;
  for (const name of MKT_QUEUE_NAMES) {
    status[name] = { pending: 0, processing: 0, done: 0, failed: 0 };
  }

  for (const row of rows) {
    const qname = getQueueForCategory(row.categoria);
    if (qname && status[qname] && status[qname][row.status] !== undefined) {
      status[qname][row.status]++;
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
    nextAttemptAt: job.next_attempt_at ?? null,
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
    next_attempt_at: job.nextAttemptAt,
    created_at: job.createdAt,
    updated_at: job.completedAt ?? job.failedAt ?? job.startedAt ?? job.createdAt,
  };
}

async function getSupabaseClient() {
  const { createSupabaseServerClient } = await import('../supabase-admin');
  return createSupabaseServerClient();
}
