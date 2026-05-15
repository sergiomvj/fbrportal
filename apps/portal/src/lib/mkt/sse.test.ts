import { afterEach, describe, expect, it, vi } from 'vitest';
import { chooseLatestSseEvent, createSseStream, deriveSseEventFromJobs, publishSse, resetSseForTests } from './sse';
import type { MktProcessingJob, MktSseEvent } from './types';

const baseJob: MktProcessingJob = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  empresa_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  estrategia_id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  categoria: 'geracao_estrategia',
  status: 'processing',
  tentativas: 1,
  max_tentativas: 3,
  payload: {},
  created_at: '2026-05-13T10:00:00.000Z',
  updated_at: '2026-05-13T10:01:00.000Z',
};

describe('MKT SSE fallbacks', () => {
  afterEach(() => {
    vi.useRealTimers();
    resetSseForTests();
  });

  it('derives a bootstrap SSE event from persisted jobs when memory state is empty', () => {
    const event = deriveSseEventFromJobs([baseJob]);

    expect(event).toEqual(
      expect.objectContaining({
        stage: 'analise',
        progress: 55,
        agent: 'estrategista_bot',
      }),
    );
  });

  it('derives FBR-Click delivery jobs as Exportador Bot operational state', () => {
    const event = deriveSseEventFromJobs([
      {
        ...baseJob,
        categoria: 'fbr_click_delivery',
        status: 'processing',
        updated_at: '2026-05-13T10:02:00.000Z',
      },
    ]);

    expect(event).toEqual(
      expect.objectContaining({
        stage: 'geracao',
        progress: 95,
        agent: 'exportador_bot',
        message: 'Enviando exportacao ao FBR-Click.',
      }),
    );
  });

  it('uses terminal lifecycle timestamps when persisted updated_at is stale', () => {
    const event = deriveSseEventFromJobs([
      {
        ...baseJob,
        categoria: 'copy',
        status: 'processing',
        updated_at: '2026-05-13T10:05:00.000Z',
      },
      {
        ...baseJob,
        categoria: 'export',
        status: 'done',
        updated_at: '2026-05-13T10:00:30.000Z',
        completed_at: '2026-05-13T10:06:00.000Z',
      },
    ]);

    expect(event).toEqual(
      expect.objectContaining({
        stage: 'pronto',
        progress: 100,
        agent: 'exportador_bot',
        timestamp: '2026-05-13T10:06:00.000Z',
      }),
    );
  });

  it('serializes the bootstrap event into the SSE stream when no live event exists', async () => {
    const bootstrap: MktSseEvent = {
      stage: 'geracao',
      progress: 80,
      message: 'Gerando artefatos taticos.',
      agent: 'redator_bot',
      timestamp: '2026-05-13T10:05:00.000Z',
      error: null,
    };

    const reader = createSseStream('estrategia-bootstrap', bootstrap).getReader();
    const decoder = new TextDecoder();
    const { value } = await reader.read();
    const output = decoder.decode(value);

    expect(output).toContain('retry: 5000');
    expect(output).toContain('"stage":"geracao"');
    expect(output).toContain('"progress":80');
  });

  it('sends a reconnect retry hint even before a persisted or live event exists', async () => {
    const reader = createSseStream('estrategia-empty').getReader();
    const decoder = new TextDecoder();
    const { value } = await reader.read();
    await reader.cancel();

    expect(decoder.decode(value)).toBe('retry: 5000\n\n');
  });

  it('uses the newest event between persisted job state and live memory state', async () => {
    const persisted: MktSseEvent = {
      stage: 'pronto',
      progress: 100,
      message: 'Persisted terminal state.',
      agent: 'workflow_bot',
      timestamp: '2026-05-13T10:10:00.000Z',
      error: null,
    };
    publishSse('estrategia-stale', {
      stage: 'geracao',
      progress: 65,
      message: 'Older in-memory state.',
      agent: 'redator_bot',
      timestamp: '2026-05-13T10:05:00.000Z',
      error: null,
    });

    expect(chooseLatestSseEvent(persisted, {
      stage: 'geracao',
      progress: 65,
      message: 'Older in-memory state.',
      agent: 'redator_bot',
      timestamp: '2026-05-13T10:05:00.000Z',
      error: null,
    })).toBe(persisted);

    const reader = createSseStream('estrategia-stale', persisted).getReader();
    const decoder = new TextDecoder();
    const { value } = await reader.read();
    const output = decoder.decode(value);

    expect(output).toContain('"stage":"pronto"');
    expect(output).toContain('"progress":100');
  });

  it('polls persisted job state after bootstrap so SSE does not depend only on memory events', async () => {
    vi.useFakeTimers();
    let persistedEvent: MktSseEvent | null = null;

    const reader = createSseStream('estrategia-persisted-poll', null, {
      persistedEventProvider: async () => persistedEvent,
      pollIntervalMs: 1000,
      heartbeatIntervalMs: 60_000,
    }).getReader();
    const decoder = new TextDecoder();

    const first = await reader.read();
    expect(decoder.decode(first.value)).toBe('retry: 5000\n\n');

    persistedEvent = {
      stage: 'geracao',
      progress: 95,
      message: 'Enviando exportacao ao FBR-Click.',
      agent: 'exportador_bot',
      timestamp: '2026-05-13T10:15:00.000Z',
      error: null,
    };

    const next = reader.read();
    await vi.advanceTimersByTimeAsync(1000);
    const polled = await next;
    await reader.cancel();

    const output = decoder.decode(polled.value);
    expect(output).toContain('"stage":"geracao"');
    expect(output).toContain('"progress":95');
    expect(output).toContain('FBR-Click');
  });
});
