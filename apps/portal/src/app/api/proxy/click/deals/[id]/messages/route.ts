import { createMessage, listMessages } from '@/lib/click/store';
import { contextOrResponse, jsonError } from '../../../_shared';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  const { id } = await params;
  const messages = listMessages(context, id);
  if (!messages) {
    return Response.json({ code: 'DEAL_NOT_FOUND', message: 'Deal not found.' }, { status: 404 });
  }

  return Response.json({ messages });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const { id } = await params;
    const message = createMessage(context, id, await request.json());
    if (!message) {
      return Response.json({ code: 'DEAL_NOT_FOUND', message: 'Deal not found.' }, { status: 404 });
    }

    return Response.json({ message }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
