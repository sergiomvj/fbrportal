import { listTasks, upsertTask } from '@/lib/click/store';
import { contextOrResponse, jsonError } from '../../../_shared';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await contextOrResponse(request);
  if (context instanceof Response) return context;

  const { id } = await params;
  const tasks = listTasks(context, id);
  if (!tasks) {
    return Response.json({ code: 'DEAL_NOT_FOUND', message: 'Deal not found.' }, { status: 404 });
  }

  return Response.json({ tasks });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const { id } = await params;
    const task = upsertTask(context, id, await request.json());
    if (!task) {
      return Response.json({ code: 'DEAL_NOT_FOUND', message: 'Deal not found.' }, { status: 404 });
    }

    return Response.json({ task }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
