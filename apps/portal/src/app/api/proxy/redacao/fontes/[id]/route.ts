import { removeFonte, updateFonte } from '@/lib/redacao/store';
import { contextOrResponse, jsonError } from '../../_shared';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const { id } = await params;
    return Response.json({ fonte: updateFonte(context, id, await request.json()) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const { id } = await params;
    return Response.json({ fonte: removeFonte(context, id) });
  } catch (error) {
    return jsonError(error);
  }
}
