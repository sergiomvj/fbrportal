import { requireSharedToken, resolveArvaConfig } from './config';
import type { ArvaClientConfig } from './types';

export function createArvaServerHeaders(config: ArvaClientConfig = {}): HeadersInit {
  const resolved = resolveArvaConfig(config);
  const token = requireSharedToken(resolved.sharedToken);

  return {
    authorization: `Bearer ${token}`,
    'content-type': 'application/json',
  };
}

export { requireSharedToken, resolveArvaConfig };
