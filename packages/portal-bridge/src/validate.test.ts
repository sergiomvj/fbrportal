import { describe, expect, it, vi } from 'vitest';
import { sendPortalMessage } from './send';
import { isValidPortalMessage } from './validate';

describe('portal bridge validation', () => {
  it('accepts the five supported message variants', () => {
    expect(
      isValidPortalMessage({ type: 'AUTH_TOKEN', payload: { token: 't', expiresAt: 'x' } }),
    ).toBe(true);
    expect(isValidPortalMessage({ type: 'NAVIGATE', payload: { path: '/click' } })).toBe(true);
    expect(
      isValidPortalMessage({
        type: 'NOTIFICATION',
        payload: { level: 'info', message: 'Ready' },
      }),
    ).toBe(true);
    expect(isValidPortalMessage({ type: 'MODULE_READY', payload: { moduleId: 'click' } })).toBe(
      true,
    );
    expect(
      isValidPortalMessage({
        type: 'CROSS_MODULE_EVENT',
        payload: { event: 'x', data: { ok: true } },
      }),
    ).toBe(true);
  });

  it('rejects invalid types and null payloads', () => {
    expect(isValidPortalMessage({ type: 'UNKNOWN', payload: {} })).toBe(false);
    expect(isValidPortalMessage({ type: 'NAVIGATE', payload: null })).toBe(false);
  });

  it('rejects unloaded iframe targets and unknown origins', () => {
    expect(() =>
      sendPortalMessage(null, { type: 'NAVIGATE', payload: { path: '/' } }, 'https://app.test'),
    ).toThrow(/not loaded/);

    expect(() =>
      sendPortalMessage(
        { postMessage: vi.fn() } as unknown as Window,
        { type: 'NAVIGATE', payload: { path: '/' } },
        'https://bad.test',
        ['https://good.test'],
      ),
    ).toThrow(/not allowed/);
  });
});
