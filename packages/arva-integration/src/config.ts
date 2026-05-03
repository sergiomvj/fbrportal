import { ArvaIntegrationError } from './errors';
import type { ArvaClientConfig } from './types';

export interface ResolvedArvaConfig {
  baseUrl: string;
  sharedToken?: string | undefined;
  fetcher: typeof fetch;
}

export function resolveArvaConfig(config: ArvaClientConfig = {}): ResolvedArvaConfig {
  const baseUrl = config.baseUrl ?? process.env.ARVA_BASE_URL;
  const fetcher = config.fetcher ?? globalThis.fetch;

  if (!baseUrl) {
    throw new ArvaIntegrationError({
      code: 'ARVA_BASE_URL_MISSING',
      message: 'ARVA_BASE_URL is required.',
    });
  }

  if (!fetcher) {
    throw new ArvaIntegrationError({
      code: 'ARVA_FETCH_UNAVAILABLE',
      message: 'A fetch implementation is required.',
    });
  }

  return {
    baseUrl: baseUrl.replace(/\/+$/, ''),
    sharedToken: config.sharedToken ?? process.env.ARVA_FBRCHAT_SHARED_TOKEN,
    fetcher,
  };
}

export function requireSharedToken(token: string | undefined): string {
  if (!token) {
    throw new ArvaIntegrationError({
      code: 'ARVA_SHARED_TOKEN_MISSING',
      message: 'ARVA_FBRCHAT_SHARED_TOKEN is required for this operation.',
    });
  }

  return token;
}
