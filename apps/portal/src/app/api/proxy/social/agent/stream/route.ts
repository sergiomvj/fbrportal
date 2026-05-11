import { getAgentPanel } from '@/lib/social/store';
import { contextOrResponse, jsonError } from '../../_shared';

export async function GET(request: Request) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const panel = getAgentPanel();
    const payload = [
      'event: agent_status',
      `data: ${JSON.stringify({ slots: panel.slots, events: panel.events.slice(0, 5) })}`,
      '',
    ].join('\n');

    return new Response(payload, {
      headers: {
        'content-type': 'text/event-stream; charset=utf-8',
        'cache-control': 'no-cache, no-transform',
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
