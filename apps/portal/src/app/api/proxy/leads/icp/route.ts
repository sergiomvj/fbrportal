import { contextFromHeaders, listICPsDb, createICPDb, updateICPDb, deleteICPDb } from '@/lib/leads/store-db';
import { jsonError } from '../_shared';

export async function GET(request: Request) {
  const context = contextFromHeaders(request.headers);
  if (context instanceof Response) return context;

  try {
    return Response.json({ icps: await listICPsDb(context) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  const context = contextFromHeaders(request.headers);
  if (context instanceof Response) return context;

  try {
    return Response.json({ icp: await createICPDb(context, await request.json()) }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request) {
  const context = contextFromHeaders(request.headers);
  if (context instanceof Response) return context;

  try {
    const body = await request.json();
    const id = body.id as string;
    if (!id) return Response.json({ code: 'BAD_REQUEST', message: 'id is required.' }, { status: 400 });
    const data = Object.fromEntries(Object.entries(body).filter(([key]) => key !== 'id'));
    return Response.json({ icp: await updateICPDb(context, id, data) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request) {
  const context = contextFromHeaders(request.headers);
  if (context instanceof Response) return context;

  try {
    const body = await request.json();
    const id = body.id as string;
    if (!id) return Response.json({ code: 'BAD_REQUEST', message: 'id is required.' }, { status: 400 });
    await deleteICPDb(context, id);
    return Response.json({ success: true });
  } catch (error) {
    return jsonError(error);
  }
}
