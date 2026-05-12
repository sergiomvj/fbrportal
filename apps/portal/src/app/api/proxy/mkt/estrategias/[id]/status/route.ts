import { contextOrResponse, jsonError } from '../../../_shared';
import { getEstrategia } from '@/lib/mkt/store';
import { getLastSseEvent, createSseStream } from '@/lib/mkt/sse';
import { withSecurityHeaders } from '@/lib/mkt/security';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const { id } = await params;
    await getEstrategia(id, context);

    const accept = request.headers.get('accept') ?? '';
    if (accept.includes('text/event-stream')) {
      const stream = createSseStream(id);
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          ...withSecurityHeaders(new Response()).headers,
        },
      });
    }

    const last = getLastSseEvent(id);
    return withSecurityHeaders(Response.json({ status: last?.stage ?? 'pending', event: last }));
  } catch (error) {
    return jsonError(error);
  }
}
