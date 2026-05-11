import {
  listMediaKits,
  createMediaKit,
} from '@/lib/sales/store';
import { contextOrResponse, jsonError } from '../_shared';

export async function GET(request: Request) {
  const contextOr = contextOrResponse(request);
  if (contextOr instanceof Response) return contextOr;
  const { userId } = contextOr;
  const companyId = contextOr.companyId;
  const context = { companyId, userId, moduleSource: 'fbr-portal' };

  try {
    const mediaKits = listMediaKits(context);
    return Response.json({ media_kits: mediaKits });
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
    const body = await request.json();
    const mediaKit = createMediaKit(context, body);
    return Response.json({ media_kit: mediaKit }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}