import { createTemplate, listTemplates, parseSocialTemplatesQuery } from '@/lib/social/store';
import { contextOrResponse, jsonError } from '../_shared';

export async function GET(request: Request) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    return Response.json({ templates: listTemplates(context, parseSocialTemplatesQuery(request.url)) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    return Response.json({ template: createTemplate(context, await request.json()) }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
