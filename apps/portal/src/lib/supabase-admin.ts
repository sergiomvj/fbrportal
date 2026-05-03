import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { getServerEnv } from './env.server';

export function createSupabaseServerClient() {
  const serverEnv = getServerEnv();

  return createClient(serverEnv.SUPABASE_URL, serverEnv.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
