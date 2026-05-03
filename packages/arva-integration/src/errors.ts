import type { ArvaErrorBody } from './types';

export class ArvaIntegrationError extends Error {
  readonly code: string;
  readonly status?: number | undefined;
  readonly cause?: unknown;

  constructor(body: ArvaErrorBody) {
    super(body.message);
    this.name = 'ArvaIntegrationError';
    this.code = body.code;
    this.status = body.status;
    this.cause = body.cause;
  }
}

export function toArvaError(error: unknown): ArvaIntegrationError {
  if (error instanceof ArvaIntegrationError) {
    return error;
  }

  return new ArvaIntegrationError({
    code: 'ARVA_NETWORK_ERROR',
    message: 'Unable to reach Arva API.',
    cause: error,
  });
}
