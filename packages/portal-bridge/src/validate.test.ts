import { describe, expect, it, vi } from 'vitest';
import { sendPortalMessage } from './send';
import { isValidPortalMessage } from './validate';

describe('portal bridge validation', () => {
  it('accepts the supported message variants including Oraculo context', () => {
    expect(
      isValidPortalMessage({ type: 'AUTH_TOKEN', payload: { userId: 'user-1', role: 'Admin' } }),
    ).toBe(true);
    expect(isValidPortalMessage({ type: 'NAVIGATE', payload: { module: 'click', path: '/click' } })).toBe(true);
    expect(
      isValidPortalMessage({
        type: 'NOTIFICATION',
        payload: { level: 'info', title: 'Ready', body: 'Bridge connected' },
      }),
    ).toBe(true);
    expect(isValidPortalMessage({ type: 'MODULE_READY', payload: { module: 'click' } })).toBe(
      true,
    );
    expect(
      isValidPortalMessage({
        type: 'CROSS_MODULE_EVENT',
        payload: { event: 'x', data: { ok: true } },
      }),
    ).toBe(true);
    expect(
      isValidPortalMessage({
        type: 'ORACULO_CONTEXT',
        payload: { module: 'leads', screen: 'pipeline', pathname: '/leads/pipeline' },
      }),
    ).toBe(true);
  });

  it('rejects invalid types and null payloads', () => {
    expect(isValidPortalMessage({ type: 'UNKNOWN', payload: {} })).toBe(false);
    expect(isValidPortalMessage({ type: 'NAVIGATE', payload: null })).toBe(false);
  });

  it('rejects unloaded iframe targets and unknown origins', () => {
    expect(() =>
      sendPortalMessage(null, { type: 'NAVIGATE', payload: { module: 'portal-ui', path: '/' } }, 'https://app.test'),
    ).toThrow(/not loaded/);

    expect(() =>
      sendPortalMessage(
        { postMessage: vi.fn() } as unknown as Window,
        { type: 'NAVIGATE', payload: { module: 'portal-ui', path: '/' } },
        'https://bad.test',
        ['https://good.test'],
      ),
    ).toThrow(/not allowed/);
  });
});
