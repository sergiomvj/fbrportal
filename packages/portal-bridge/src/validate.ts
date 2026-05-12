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
      return hasString(value.payload, 'userId') && hasString(value.payload, 'role');
    case 'NAVIGATE':
      return hasString(value.payload, 'module') && hasString(value.payload, 'path');
    case 'NOTIFICATION':
      return (
        ['info', 'warn', 'error'].includes(
          String(value.payload.level),
        ) && hasString(value.payload, 'title') && hasString(value.payload, 'body')
      );
    case 'MODULE_READY':
      return hasString(value.payload, 'module');
    case 'CROSS_MODULE_EVENT':
      return hasString(value.payload, 'event') && 'data' in value.payload;
    case 'ORACULO_CONTEXT':
      return (
        hasString(value.payload, 'module') &&
        hasString(value.payload, 'screen') &&
        (!('entity' in value.payload) ||
          (isRecord(value.payload.entity) &&
            hasString(value.payload.entity, 'type') &&
            hasString(value.payload.entity, 'id')))
      );
    default:
      return false;
  }
}

export function isAllowedOrigin(origin: string, allowedOrigins: readonly string[]): boolean {
  return allowedOrigins.includes(origin);
}
