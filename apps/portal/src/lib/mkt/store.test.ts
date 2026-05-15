import { describe, expect, it } from 'vitest';
import { calculateAverageGenerationSeconds } from './store-helpers';

describe('MKT store dashboard helpers', () => {
  it('derives average generation time from persisted job timestamps instead of a fixed value', () => {
    expect(calculateAverageGenerationSeconds([
      {
        started_at: '2026-05-13T10:00:00.000Z',
        completed_at: '2026-05-13T10:00:30.000Z',
      },
      {
        created_at: '2026-05-13T10:01:00.000Z',
        completed_at: '2026-05-13T10:02:30.000Z',
      },
      {
        started_at: 'invalid',
        completed_at: '2026-05-13T10:03:00.000Z',
      },
    ])).toBe(60);
  });

  it('returns zero when no completed persisted job can be measured', () => {
    expect(calculateAverageGenerationSeconds([
      { started_at: '2026-05-13T10:00:00.000Z' },
      {
        started_at: '2026-05-13T10:01:00.000Z',
        completed_at: '2026-05-13T10:00:00.000Z',
      },
    ])).toBe(0);
  });
});
