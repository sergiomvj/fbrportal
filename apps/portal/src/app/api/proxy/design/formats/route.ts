import { listFormats } from '@/lib/design/store';
import { contextOrResponse, jsonError } from '../_shared';

export async function GET(request: Request) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    return Response.json({ formats: listFormats() });
  } catch (error) {
    return jsonError(error);
  }
}
