import { describe, expect, it } from 'vitest';
import { buildMktNextAttemptAt, buildQueueStatusFromRows, getMktRetryDelayMs, isMktJobReadyForProcessing, MKT_QUEUE_NAMES } from './queue';

describe('MKT queue contracts', () => {
  it('exposes the PRD-required queue topology even when no jobs exist', () => {
    const status = buildQueueStatusFromRows([]);

    expect(Object.keys(status)).toEqual([...MKT_QUEUE_NAMES]);
    expect(status['mkt:upload']).toEqual({ pending: 0, processing: 0, done: 0, failed: 0 });
    expect(status['mkt:estrategia']).toEqual({ pending: 0, processing: 0, done: 0, failed: 0 });
    expect(status['mkt:copy']).toEqual({ pending: 0, processing: 0, done: 0, failed: 0 });
    expect(status['mkt:calendario']).toEqual({ pending: 0, processing: 0, done: 0, failed: 0 });
    expect(status['mkt:export']).toEqual({ pending: 0, processing: 0, done: 0, failed: 0 });
    expect(status['mkt:fbr_click']).toEqual({ pending: 0, processing: 0, done: 0, failed: 0 });
  });

  it('aggregates persisted jobs into their operational queues', () => {
    const status = buildQueueStatusFromRows([
      { categoria: 'upload', status: 'pending' },
      { categoria: 'extracao', status: 'processing' },
      { categoria: 'geracao_estrategia', status: 'done' },
      { categoria: 'copy', status: 'failed' },
      { categoria: 'calendario', status: 'pending' },
      { categoria: 'export', status: 'processing' },
      { categoria: 'fbr_click_delivery', status: 'pending' },
    ]);

    expect(status['mkt:upload']).toEqual({ pending: 1, processing: 1, done: 0, failed: 0 });
    expect(status['mkt:estrategia']).toEqual({ pending: 0, processing: 0, done: 1, failed: 0 });
    expect(status['mkt:copy']).toEqual({ pending: 0, processing: 0, done: 0, failed: 1 });
    expect(status['mkt:calendario']).toEqual({ pending: 1, processing: 0, done: 0, failed: 0 });
    expect(status['mkt:export']).toEqual({ pending: 0, processing: 1, done: 0, failed: 0 });
    expect(status['mkt:fbr_click']).toEqual({ pending: 1, processing: 0, done: 0, failed: 0 });
  });

  it('models exponential retry scheduling for persisted jobs', () => {
    const now = Date.parse('2026-05-14T10:00:00.000Z');
    const nextAttemptAt = buildMktNextAttemptAt(3, now);

    expect(getMktRetryDelayMs(1)).toBe(5000);
    expect(getMktRetryDelayMs(2)).toBe(10000);
    expect(getMktRetryDelayMs(3)).toBe(20000);
    expect(nextAttemptAt).toBe('2026-05-14T10:00:20.000Z');
    expect(isMktJobReadyForProcessing({ next_attempt_at: nextAttemptAt }, now + 19_999)).toBe(false);
    expect(isMktJobReadyForProcessing({ next_attempt_at: nextAttemptAt }, now + 20_000)).toBe(true);
    expect(isMktJobReadyForProcessing({ next_attempt_at: null }, now)).toBe(true);
  });
});
