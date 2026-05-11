import { listArtigos, createArtigo, parseArtigosQuery } from '@/lib/redacao/store';
import { contextOrResponse, jsonError } from '../_shared';

export async function GET(request: Request) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const result = listArtigos(context, parseArtigosQuery(request.url));
    return Response.json({ artigos: result.items, pagination: result.pagination });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    return Response.json({ artigo: createArtigo(context, await request.json()) }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
