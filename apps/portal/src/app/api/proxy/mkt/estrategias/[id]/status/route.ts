import { contextOrResponse, jsonError } from '../../../_shared';
import { getEstrategia } from '@/lib/mkt/store';
import { convertToProcessingJob, getJobsByEstrategia } from '@/lib/mkt/queue';
import { chooseLatestSseEvent, createSseStream, deriveSseEventFromJobs, getLastSseEvent } from '@/lib/mkt/sse';
import { withSecurityHeaders } from '@/lib/mkt/security';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const { id } = await params;
    await getEstrategia(id, context);
    const loadPersistedEvent = async () => deriveSseEventFromJobs(
      (await getJobsByEstrategia(id, context.companyId)).map(convertToProcessingJob),
    );
    const persistedEvent = await loadPersistedEvent();
    const bootstrapEvent = chooseLatestSseEvent(persistedEvent, getLastSseEvent(id));

    const accept = request.headers.get('accept') ?? '';
    if (accept.includes('text/event-stream')) {
      const stream = createSseStream(id, bootstrapEvent, {
        persistedEventProvider: loadPersistedEvent,
      });
      const response = new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
      withSecurityHeaders(response);
      response.headers.set('Cache-Control', 'no-cache');
      return response;
    }

    return withSecurityHeaders(Response.json({ status: bootstrapEvent?.stage ?? 'pending', event: bootstrapEvent }));
  } catch (error) {
    return jsonError(error);
  }
}
