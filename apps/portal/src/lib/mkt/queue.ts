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

const queues = new Map<MktQueueName, MktQueueJob[]>();
const processors = new Map<MktQueueName, JobProcessor>();
const processing = new Map<string, boolean>();

for (const name of MKT_QUEUE_NAMES) {
  queues.set(name, []);
}

export function registerProcessor(queueName: MktQueueName, processor: JobProcessor) {
  processors.set(queueName, processor);
}

export async function enqueueJob(
  category: MktJobCategory,
  estrategiaId: string,
  empresaId: string,
  payload: Record<string, unknown> = {},
): Promise<MktQueueJob> {
  const queueName = getQueueForCategory(category);
  const job: MktQueueJob = {
    id: crypto.randomUUID(),
    category,
    estrategiaId,
    empresaId,
    payload,
    status: 'pending',
    tentativas: 0,
    maxTentativas: MKT_DEFAULT_JOB_CONFIG.attempts,
    erroMensagem: null,
    createdAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null,
    failedAt: null,
  };

  const queue = queues.get(queueName)!;
  queue.push(job);

  processQueue(queueName).catch(() => {});

  return job;
}

async function processQueue(queueName: MktQueueName) {
  const queue = queues.get(queueName)!;
  const processor = processors.get(queueName);

  if (!processor) return;

  const pendingJobs = queue.filter((j) => j.status === 'pending');

  for (const job of pendingJobs) {
    if (processing.get(job.id)) continue;
    processing.set(job.id, true);

    job.status = 'processing';
    job.startedAt = new Date().toISOString();
    job.tentativas += 1;

    try {
      await processor(job);
      job.status = 'done';
      job.completedAt = new Date().toISOString();
    } catch (err) {
      job.erroMensagem = err instanceof Error ? err.message : 'Unknown error';

      if (job.tentativas < job.maxTentativas) {
        const delay =
          MKT_DEFAULT_JOB_CONFIG.backoff.delay *
          Math.pow(2, job.tentativas - 1);
        job.status = 'pending';
        job.startedAt = null;
        setTimeout(() => {
          processing.delete(job.id);
          processQueue(queueName).catch(() => {});
        }, delay);
        continue;
      }

      job.status = 'failed';
      job.failedAt = new Date().toISOString();
    }

    processing.delete(job.id);
  }
}

export function getJob(jobId: string): MktQueueJob | null {
  for (const queue of queues.values()) {
    const found = queue.find((j) => j.id === jobId);
    if (found) return found;
  }
  return null;
}

export function getJobsByEstrategia(estrategiaId: string): MktQueueJob[] {
  const results: MktQueueJob[] = [];
  for (const queue of queues.values()) {
    for (const job of queue) {
      if (job.estrategiaId === estrategiaId) results.push(job);
    }
  }
  return results;
}

export function getQueueStatus(): Record<MktQueueName, { pending: number; processing: number; done: number; failed: number }> {
  const status = {} as Record<MktQueueName, { pending: number; processing: number; done: number; failed: number }>;
  for (const [name, queue] of queues.entries()) {
    status[name] = {
      pending: queue.filter((j) => j.status === 'pending').length,
      processing: queue.filter((j) => j.status === 'processing').length,
      done: queue.filter((j) => j.status === 'done').length,
      failed: queue.filter((j) => j.status === 'failed').length,
    };
  }
  return status;
}

export function resetQueuesForTests() {
  for (const name of MKT_QUEUE_NAMES) {
    queues.set(name, []);
  }
  processing.clear();
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
