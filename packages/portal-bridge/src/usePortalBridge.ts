'use client';

import { useEffect } from 'react';
import type { PortalMessage } from './types';
import { isAllowedOrigin, isValidPortalMessage } from './validate';

type Handler = (message: PortalMessage, event: MessageEvent) => void;

export function usePortalBridge(
  allowedOrigins: readonly string[],
  onMessage: Handler,
): void {
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (!isAllowedOrigin(event.origin, allowedOrigins)) {
        return;
      }

      if (!isValidPortalMessage(event.data)) {
        return;
      }

      onMessage(event.data, event);
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [allowedOrigins, onMessage]);
}
