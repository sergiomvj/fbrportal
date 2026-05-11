import { contextOrResponse, jsonError } from '../../../_shared';
import { saveChatMessage, listChatByEstrategia, getEstrategia } from '@/lib/mkt/store';
import { checkRateLimit, rateLimitHeaders, rateLimitResponse, withSecurityHeaders, MKT_RATE_LIMITS } from '@/lib/mkt/security';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const { id } = await params;
    const messages = listChatByEstrategia(id, context);
    return withSecurityHeaders(Response.json({ messages }));
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  const rl = checkRateLimit(`chat:${context.userId}:${context.companyId}`, MKT_RATE_LIMITS.chat ?? { windowMs: 60_000, maxRequests: 20 });
  if (!rl.allowed) return rateLimitResponse(rl);

  try {
    const { id } = await params;
    getEstrategia(id, context);
    const body = await request.json();
    const { message } = body as { message?: string };

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return Response.json({ code: 'BAD_REQUEST', message: 'Message is required.' }, { status: 400 });
    }

    if (message.length > 2000) {
      return Response.json({ code: 'BAD_REQUEST', message: 'Message too long. Maximum 2000 characters.' }, { status: 400 });
    }

    const existingMessages = listChatByEstrategia(id, context, 50);
    if (existingMessages.length >= 50) {
      return Response.json({ code: 'LIMIT_REACHED', message: 'Chat limit reached. Start a new session.' }, { status: 429 });
    }

    const userMsg = saveChatMessage({
      estrategia_id: id,
      role: 'user',
      conteudo: message.trim(),
    });

    const assistantMsg = saveChatMessage({
      estrategia_id: id,
      role: 'assistant',
      conteudo: `Recebi sua mensagem: "${message.trim()}". O assistente contextual MKT estara disponivel em breve com suporte completo a LLM.`,
    });

    const resp = Response.json({ user_message: userMsg, assistant_message: assistantMsg });
    const headers = rateLimitHeaders(rl);
    for (const [k, v] of Object.entries(headers)) resp.headers.set(k, v);
    return withSecurityHeaders(resp);
  } catch (error) {
    return jsonError(error);
  }
}
