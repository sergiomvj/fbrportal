import { listReports } from '@/lib/leads/store';
import { contextOrResponse, jsonError } from '../_shared';

export async function GET(request: Request) {
  const context = await contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    return Response.json({ reports: listReports(context) });
  } catch (error) {
    return jsonError(error);
  }
}
