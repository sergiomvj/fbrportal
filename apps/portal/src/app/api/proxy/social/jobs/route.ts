import { createJob, listJobs, parseSocialJobsQuery } from '@/lib/social/store';
import { contextOrResponse, jsonError } from '../_shared';

export async function GET(request: Request) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const result = listJobs(context, parseSocialJobsQuery(request.url));
    return Response.json({ jobs: result.items, pagination: result.pagination });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    return Response.json({ job: createJob(context, await request.json()) }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
