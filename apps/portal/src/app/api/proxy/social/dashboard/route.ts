import { getDashboardSnapshot } from '@/lib/social/store';
import { contextOrResponse, jsonError } from '../_shared';

export async function GET(request: Request) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    return Response.json({ dashboard: getDashboardSnapshot(context) });
  } catch (error) {
    return jsonError(error);
  }
}
