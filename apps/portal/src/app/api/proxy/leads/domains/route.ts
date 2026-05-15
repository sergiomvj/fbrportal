import { contextFromHeaders, listDomainsDb, createDomainDb, updateDomainDb, deleteDomainDb } from '@/lib/leads/store-db';
import { jsonError } from '../_shared';

export async function GET(request: Request) {
  const context = contextFromHeaders(request.headers);
  if (context instanceof Response) return context;

  try {
    return Response.json({ domains: await listDomainsDb(context) });
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
    const data = Object.fromEntries(Object.entries(body).filter(([k]) => k !== 'id'));
    return Response.json({ domain: await updateDomainDb(context, id, data) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  const context = contextFromHeaders(request.headers);
  if (context instanceof Response) return context;

  try {
    return Response.json({ domain: await createDomainDb(context, await request.json()) }, { status: 201 });
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
    await deleteDomainDb(context, id);
    return Response.json({ success: true });
  } catch (error) {
    return jsonError(error);
  }
}
