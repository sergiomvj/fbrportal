import type { MktSseEvent, MktSseStage } from './types';

type SseSubscriber = (event: MktSseEvent) => void;

const channels = new Map<string, Set<SseSubscriber>>();
const lastEvents = new Map<string, MktSseEvent>();

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
): () => void {
  if (!channels.has(estrategiaId)) {
    channels.set(estrategiaId, new Set());
  }
  channels.get(estrategiaId)!.add(subscriber);

  const last = lastEvents.get(estrategiaId);
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

export function createSseStream(estrategiaId: string): ReadableStream {
  let unsubscribe: (() => void) | null = null;

  return new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const send = (event: MktSseEvent) => {
        const data = `data: ${JSON.stringify(event)}\n\n`;
        controller.enqueue(encoder.encode(data));
      };

      unsubscribe = subscribeSse(estrategiaId, send);

      const last = getLastSseEvent(estrategiaId);
      if (last) send(last);
    },
    cancel() {
      unsubscribe?.();
    },
  });
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
