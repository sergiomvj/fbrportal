import { contextOrResponse, jsonError } from '../_shared';
import { listNotifications, markNotificationRead } from '@/lib/mkt/notifications';
import { withSecurityHeaders } from '@/lib/mkt/security';

export async function GET(request: Request) {
  const context = await contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const url = new URL(request.url);
    const unreadOnly = url.searchParams.get('unread') === 'true';
    const items = await listNotifications(context.companyId, { userId: context.userId, unreadOnly });
    return withSecurityHeaders(Response.json({ notifications: items }));
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request) {
  const context = await contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const body = await request.json();
    const { notification_id } = body as { notification_id?: string };
    if (!notification_id) {
      return Response.json({ code: 'BAD_REQUEST', message: 'notification_id required.' }, { status: 400 });
    }
    const marked = await markNotificationRead(notification_id, context.companyId);
    return withSecurityHeaders(Response.json({ ok: marked }));
  } catch (error) {
    return jsonError(error);
  }
}
