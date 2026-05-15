import { contextFromHeaders } from '@/lib/leads/store-db';
import { captureLeadsFromSourceDb, getSourceRunDb, listSourceRunsDb } from '@/lib/leads/source-capture';
import { jsonError } from '../_shared';

export async function GET(request: Request) {
  const context = contextFromHeaders(request.headers);
  if (context instanceof Response) return context;

  try {
    const url = new URL(request.url);
    const runId = url.searchParams.get('id');
    if (runId) {
      const run = await getSourceRunDb(context, runId);
      const records = await Promise.all([
        import('@/lib/leads/source-capture').then(m => m.listSourceRecordsByRunDb(context, runId)),
      ]);
      return Response.json({ run, records: records[0] });
    }
    return Response.json({ source_runs: await listSourceRunsDb(context) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  const context = contextFromHeaders(request.headers);
  if (context instanceof Response) return context;

  try {
    const result = await captureLeadsFromSourceDb(context, await request.json());
    return Response.json(result, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
