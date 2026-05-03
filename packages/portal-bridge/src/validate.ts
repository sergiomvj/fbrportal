import type { PortalMessage } from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasString(value: Record<string, unknown>, key: string): boolean {
  return typeof value[key] === 'string' && value[key].length > 0;
}

export function isValidPortalMessage(value: unknown): value is PortalMessage {
  if (!isRecord(value) || typeof value.type !== 'string' || !isRecord(value.payload)) {
    return false;
  }

  switch (value.type) {
    case 'AUTH_TOKEN':
      return hasString(value.payload, 'token') && hasString(value.payload, 'expiresAt');
    case 'NAVIGATE':
      return hasString(value.payload, 'path');
    case 'NOTIFICATION':
      return (
        ['info', 'success', 'warning', 'error'].includes(
          String(value.payload.level),
        ) && hasString(value.payload, 'message')
      );
    case 'MODULE_READY':
      return hasString(value.payload, 'moduleId');
    case 'CROSS_MODULE_EVENT':
      return hasString(value.payload, 'event') && 'data' in value.payload;
    default:
      return false;
  }
}

export function isAllowedOrigin(origin: string, allowedOrigins: readonly string[]): boolean {
  return allowedOrigins.includes(origin);
}
