import { listGallery, parseSocialGalleryQuery } from '@/lib/social/store';
import { contextOrResponse, jsonError } from '../_shared';

export async function GET(request: Request) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    return Response.json({ artefacts: listGallery(context, parseSocialGalleryQuery(request.url)) });
  } catch (error) {
    return jsonError(error);
  }
}
