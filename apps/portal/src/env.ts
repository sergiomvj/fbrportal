import { z } from 'zod';

export const envSchema = z.object({
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters.'),
  SUPABASE_URL: z.string().url().refine((value) => value.includes('supabase.co'), {
    message: 'SUPABASE_URL must be a valid Supabase URL.',
  }),
  SUPABASE_ANON_KEY: z.string().min(1),
  NEXTAUTH_URL: z.string().url(),
  OPENCLAW_GATEWAY_URL: z.string().url(),
  OPENROUTER_API_KEY: z.string().min(1),
  OPENROUTER_MODEL: z.string().min(1),
  OPENROUTER_BASE_URL: z.string().url().optional(),
});

export type PortalEnv = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, string | undefined>): PortalEnv {
  return envSchema.parse({
    SESSION_SECRET: source.SESSION_SECRET,
    SUPABASE_URL: source.SUPABASE_URL,
    SUPABASE_ANON_KEY: source.SUPABASE_ANON_KEY,
    NEXTAUTH_URL: source.NEXTAUTH_URL,
    OPENCLAW_GATEWAY_URL: source.OPENCLAW_GATEWAY_URL,
    OPENROUTER_API_KEY: source.OPENROUTER_API_KEY,
    OPENROUTER_MODEL: source.OPENROUTER_MODEL,
    OPENROUTER_BASE_URL: source.OPENROUTER_BASE_URL,
  });
}

export function getEnv(): PortalEnv {
  return parseEnv(process.env);
}
