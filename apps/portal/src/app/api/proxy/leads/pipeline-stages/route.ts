import { createPipelineStage, listPipelineStages, updatePipelineStage } from '@/lib/leads/store';
import { jsonError } from '../_shared';

export async function GET() {
  try {
    return Response.json({ stages: listPipelineStages() });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    return Response.json({ stage: createPipelineStage(await request.json()) }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const id = body.id as string;
    if (!id) return Response.json({ code: 'BAD_REQUEST', message: 'id is required.' }, { status: 400 });
    const data = Object.fromEntries(Object.entries(body).filter(([key]) => key !== 'id'));
    return Response.json({ stage: updatePipelineStage(id, data) });
  } catch (error) {
    return jsonError(error);
  }
}
