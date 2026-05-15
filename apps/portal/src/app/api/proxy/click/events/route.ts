import { recordStrategyExportedEvent } from '@/lib/click/store';
import { contextOrResponse, jsonError } from '../_shared';

export async function POST(request: Request) {
  const context = await contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const event = recordStrategyExportedEvent(context, await request.json());
    return Response.json({ accepted: true, event: event.event }, { status: 202 });
  } catch (error) {
    return jsonError(error);
  }
}
