import {
  listConcepts,
  createConcept,
  searchConceptsSimilarity,
} from '@/lib/videoflow/store';
import type { Channel, ConceptQuery } from '@/lib/videoflow/types';
import { contextOrResponse, jsonError } from '../_shared';

export async function GET(request: Request) {
  const contextOr = contextOrResponse(request);
  if (contextOr instanceof Response) return contextOr;
  const { userId } = contextOr;
  const companyId = contextOr.companyId;
  const context = { companyId, userId, moduleSource: 'fbr-portal' };

  try {
    const url = new URL(request.url);
    const canalValue = url.searchParams.get('canal');
    const query: Partial<ConceptQuery> = {};
    const busca = url.searchParams.get('busca');
    if (busca) query.busca = busca;
    if (canalValue && ['instagram_reels', 'youtube', 'tiktok', 'linkedin', 'twitter', 'facebook_feed', 'stories', 'tv_web'].includes(canalValue)) {
      query.canal = canalValue as Channel;
    }
    if (url.searchParams.get('aprovado') === 'true') query.aprovado = true;
    else if (url.searchParams.get('aprovado') === 'false') query.aprovado = false;
    const concepts = listConcepts(context, query);
    return Response.json({ concepts });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  const contextOr = contextOrResponse(request);
  if (contextOr instanceof Response) return contextOr;
  const { userId } = contextOr;
  const companyId = contextOr.companyId;
  const context = { companyId, userId, moduleSource: 'fbr-portal' };

  try {
    const url = new URL(request.url);
    if (url.searchParams.get('action') === 'search') {
      const body = await request.json();
      const results = searchConceptsSimilarity(context, body.query, body.top_k || 3);
      return Response.json({ results });
    }
    return Response.json({ concept: createConcept(context, await request.json()) }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
