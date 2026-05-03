import { z } from 'zod';

export const sessionDataSchema = z.object({
  userId: z.string().min(1),
  email: z.string().email(),
  role: z.string().min(1),
  empresaId: z.string().min(1),
});

export type SessionData = z.infer<typeof sessionDataSchema>;

export type PublicSessionUser = Omit<SessionData, 'userId'>;

export type SessionResponse =
  | { user: PublicSessionUser; isLoading: false; error: null }
  | { user: null; isLoading: false; error: string | null };
