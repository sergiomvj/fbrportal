import { listAgentes } from '@/lib/redacao/store';
import { jsonError } from '../_shared';

export async function GET() {
  try {
    return Response.json({ agentes: listAgentes() });
  } catch (error) {
    return jsonError(error);
  }
}
