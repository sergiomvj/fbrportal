import 'server-only';
import { getEnv } from '../env';

export function getServerEnv() {
  return getEnv();
}
