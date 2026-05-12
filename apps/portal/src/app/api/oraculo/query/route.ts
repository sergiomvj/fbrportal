import { getSession } from '@fbr/auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { OraculoContext } from '@/lib/oraculo/types';
import { queryOraculo } from '@/lib/oraculo/query';

const requestSchema = z.object({
  question: z.string().min(3),
  context: z.object({
    module: z.string().min(1),
    moduleLabel: z.string().min(1),
    screen: z.string().min(1),
    screenLabel: z.string().min(1),
    pathname: z.string().min(1),
    suggestedQuestions: z.array(z.string()),
    entity: z
      .object({
        type: z.string().min(1),
        id: z.string().min(1),
      })
      .optional(),
  }),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid Oraculo query payload.' }, { status: 400 });
  }

  const context: OraculoContext = parsed.data.context.entity
    ? parsed.data.context
    : Object.fromEntries(
        Object.entries(parsed.data.context).filter(([key]) => key !== 'entity'),
      ) as OraculoContext;

  const response = await queryOraculo(parsed.data.question, context);
  return NextResponse.json(response);
}
