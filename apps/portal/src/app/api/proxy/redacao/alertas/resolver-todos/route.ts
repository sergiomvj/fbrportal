import { resolveAllAlertas } from '@/lib/redacao/store';
import { contextOrResponse, jsonError } from '../../_shared';

export async function PATCH(request: Request) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    return Response.json({ resolved: resolveAllAlertas(context) });
  } catch (error) {
    return jsonError(error);
  }
}
