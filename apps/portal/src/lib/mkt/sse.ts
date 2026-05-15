import type { MktProcessingJob, MktSseEvent, MktSseStage } from './types';

type SseSubscriber = (event: MktSseEvent) => void;

const channels = new Map<string, Set<SseSubscriber>>();
const lastEvents = new Map<string, MktSseEvent>();

export interface MktSseStreamOptions {
  persistedEventProvider?: () => Promise<MktSseEvent | null>;
  pollIntervalMs?: number;
  heartbeatIntervalMs?: number;
}

export function publishSse(estrategiaId: string, event: MktSseEvent) {
  lastEvents.set(estrategiaId, event);
  const subs = channels.get(estrategiaId);
  if (subs) {
    for (const fn of subs) {
      try {
        fn(event);
      } catch {
        // subscriber threw, ignore
      }
    }
  }
}

export function subscribeSse(
  estrategiaId: string,
  subscriber: SseSubscriber,
  replayLast = true,
): () => void {
  if (!channels.has(estrategiaId)) {
    channels.set(estrategiaId, new Set());
  }
  channels.get(estrategiaId)!.add(subscriber);

  const last = replayLast ? lastEvents.get(estrategiaId) : null;
  if (last) {
    try {
      subscriber(last);
    } catch {
      // ignore
    }
  }

  return () => {
    channels.get(estrategiaId)?.delete(subscriber);
  };
}

export function getLastSseEvent(estrategiaId: string): MktSseEvent | null {
  return lastEvents.get(estrategiaId) ?? null;
}

export function deriveSseEventFromJobs(jobs: MktProcessingJob[]): MktSseEvent | null {
  if (jobs.length === 0) return null;

  const latest = [...jobs].sort((left, right) => {
    const leftTs = latestJobTimestampMs(left);
    const rightTs = latestJobTimestampMs(right);
    return rightTs - leftTs;
  })[0];
  if (!latest) return null;

  const stage = stageForCategory(latest.categoria);
  const timestamp = latestJobTimestamp(latest) ?? new Date().toISOString();

  if (latest.status === 'failed') {
    return {
      stage,
      progress: 0,
      message: latest.erro_mensagem ?? 'Processamento falhou.',
      timestamp,
      error: {
        code: 'JOB_FAILED',
        message: latest.erro_mensagem ?? 'Processamento falhou.',
      },
    };
  }

  if (latest.status === 'done') {
    return {
      stage: 'pronto',
      progress: 100,
      message: 'Processamento concluido com sucesso.',
      agent: agentForStage('pronto', latest.categoria),
      timestamp,
      error: null,
    };
  }

  return {
    stage,
    progress: progressForJob(latest),
    message: latest.status === 'processing' ? messageForStage(stage, latest.categoria) : 'Job aguardando processamento.',
    agent: agentForStage(stage, latest.categoria),
    timestamp,
    error: null,
  };
}

export function createSseStream(
  estrategiaId: string,
  bootstrapEvent?: MktSseEvent | null,
  options: MktSseStreamOptions = {},
): ReadableStream {
  let unsubscribe: (() => void) | null = null;
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  return new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      let sentRetry = false;
      let latestEvent: MktSseEvent | null = chooseLatestSseEvent(bootstrapEvent, getLastSseEvent(estrategiaId));

      const send = (event: MktSseEvent) => {
        latestEvent = event;
        const retry = sentRetry ? '' : 'retry: 5000\n';
        sentRetry = true;
        const data = `${retry}data: ${JSON.stringify(event)}\n\n`;
        controller.enqueue(encoder.encode(data));
      };

      unsubscribe = subscribeSse(estrategiaId, send, false);

      if (latestEvent) send(latestEvent);
      else {
        sentRetry = true;
        controller.enqueue(encoder.encode('retry: 5000\n\n'));
      }

      if (options.persistedEventProvider) {
        pollTimer = setInterval(async () => {
          try {
            const persistedEvent = await options.persistedEventProvider?.();
            const nextEvent = chooseLatestSseEvent(persistedEvent, getLastSseEvent(estrategiaId));
            if (nextEvent && !isSameSseEvent(nextEvent, latestEvent)) {
              send(nextEvent);
            }
          } catch {
            // Keep the SSE connection alive; the next poll can recover from transient storage errors.
          }
        }, options.pollIntervalMs ?? 5000);
      }

      heartbeatTimer = setInterval(() => {
        controller.enqueue(encoder.encode(`: heartbeat ${new Date().toISOString()}\n\n`));
      }, options.heartbeatIntervalMs ?? 15000);
    },
    cancel() {
      unsubscribe?.();
      if (pollTimer) clearInterval(pollTimer);
      if (heartbeatTimer) clearInterval(heartbeatTimer);
    },
  });
}

export function chooseLatestSseEvent(
  persistedEvent?: MktSseEvent | null,
  liveEvent?: MktSseEvent | null,
): MktSseEvent | null {
  if (!persistedEvent) return liveEvent ?? null;
  if (!liveEvent) return persistedEvent;

  return timestampMs(liveEvent.timestamp) > timestampMs(persistedEvent.timestamp) ? liveEvent : persistedEvent;
}

export function emitExtracao(estrategiaId: string, progress: number, message: string) {
  publishSse(estrategiaId, {
    stage: 'extracao',
    progress,
    message,
    agent: 'extrator_bot',
    timestamp: new Date().toISOString(),
    error: null,
  });
}

export function emitAnalise(estrategiaId: string, progress: number, message: string) {
  publishSse(estrategiaId, {
    stage: 'analise',
    progress,
    message,
    agent: 'estrategista_bot',
    timestamp: new Date().toISOString(),
    error: null,
  });
}

export function emitGeracao(estrategiaId: string, progress: number, message: string, agent?: string) {
  publishSse(estrategiaId, {
    stage: 'geracao',
    progress,
    message,
    agent: agent ?? 'redator_bot',
    timestamp: new Date().toISOString(),
    error: null,
  });
}

export function emitPronto(estrategiaId: string) {
  publishSse(estrategiaId, {
    stage: 'pronto',
    progress: 100,
    message: 'Estrategia pronta para revisao!',
    timestamp: new Date().toISOString(),
    error: null,
  });
}

export function emitSseError(
  estrategiaId: string,
  stage: MktSseStage,
  code: string,
  message: string,
) {
  publishSse(estrategiaId, {
    stage,
    progress: 0,
    message,
    timestamp: new Date().toISOString(),
    error: { code, message },
  });
}

export function resetSseForTests() {
  channels.clear();
  lastEvents.clear();
}

function stageForCategory(category: MktProcessingJob['categoria']): MktSseStage {
  switch (category) {
    case 'upload':
    case 'extracao':
      return 'extracao';
    case 'geracao_estrategia':
      return 'analise';
    case 'copy':
    case 'calendario':
    case 'export':
    case 'fbr_click_delivery':
    default:
      return 'geracao';
  }
}

function progressForJob(job: MktProcessingJob): number {
  switch (job.categoria) {
    case 'upload':
    case 'extracao':
      return job.status === 'processing' ? 25 : 5;
    case 'geracao_estrategia':
      return job.status === 'processing' ? 55 : 35;
    case 'copy':
    case 'calendario':
      return job.status === 'processing' ? 80 : 65;
    case 'export':
      return job.status === 'processing' ? 90 : 75;
    case 'fbr_click_delivery':
      return job.status === 'processing' ? 95 : 85;
    default:
      return 0;
  }
}

function messageForStage(stage: MktSseStage, category?: MktProcessingJob['categoria']): string {
  if (category === 'fbr_click_delivery') {
    return 'Enviando exportacao ao FBR-Click.';
  }

  switch (stage) {
    case 'extracao':
      return 'Extraindo e estruturando o diagnostico.';
    case 'analise':
      return 'Analisando o diagnostico e montando a estrategia.';
    case 'geracao':
      return 'Gerando artefatos taticos e exportacoes.';
    case 'pronto':
    default:
      return 'Processamento concluido.';
  }
}

function agentForStage(stage: MktSseStage, category?: MktProcessingJob['categoria']): string {
  if (category === 'fbr_click_delivery' || category === 'export') {
    return 'exportador_bot';
  }

  switch (stage) {
    case 'extracao':
      return 'extrator_bot';
    case 'analise':
      return 'estrategista_bot';
    case 'geracao':
      return 'redator_bot';
    case 'pronto':
    default:
      return 'workflow_bot';
  }
}

function timestampMs(timestamp: string): number {
  const parsed = Date.parse(timestamp);
  return Number.isFinite(parsed) ? parsed : 0;
}

function latestJobTimestamp(job: MktProcessingJob): string | null {
  const candidates = [
    job.updated_at,
    job.failed_at,
    job.completed_at,
    job.started_at,
    job.created_at,
  ].filter((timestamp): timestamp is string => Boolean(timestamp));

  return candidates.sort((left, right) => timestampMs(right) - timestampMs(left))[0] ?? null;
}

function latestJobTimestampMs(job: MktProcessingJob): number {
  const timestamp = latestJobTimestamp(job);
  return timestamp ? timestampMs(timestamp) : 0;
}

function isSameSseEvent(left: MktSseEvent | null, right: MktSseEvent | null): boolean {
  if (!left || !right) return left === right;
  return JSON.stringify(left) === JSON.stringify(right);
}
