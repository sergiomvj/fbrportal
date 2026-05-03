import type { PortalMessage } from './types';
import { isAllowedOrigin, isValidPortalMessage } from './validate';

export function sendPortalMessage(
  target: Window | null | undefined,
  message: PortalMessage,
  targetOrigin: string,
  allowedOrigins: readonly string[] = [targetOrigin],
): void {
  if (!target) {
    throw new Error('Portal target iframe is not loaded.');
  }

  if (!isValidPortalMessage(message)) {
    throw new Error('Invalid portal message payload.');
  }

  if (!isAllowedOrigin(targetOrigin, allowedOrigins)) {
    throw new Error('Target origin is not allowed.');
  }

  target.postMessage(message, targetOrigin);
}
