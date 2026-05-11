import { softDeleteTemplate, updateTemplate } from '@/lib/social/store';
import { contextOrResponse, jsonError } from '../../_shared';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const { id } = await params;
    return Response.json({ template: updateTemplate(context, id, await request.json()) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const { id } = await params;
    return Response.json({ template: softDeleteTemplate(context, id) });
  } catch (error) {
    return jsonError(error);
  }
}
