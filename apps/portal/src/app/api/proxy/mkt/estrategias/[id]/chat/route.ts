import { contextOrResponse, jsonError } from '../../../_shared';
import { saveChatMessage, listChatByEstrategia, getEstrategia } from '@/lib/mkt/store';
import { checkRateLimit, rateLimitHeaders, rateLimitResponse, withSecurityHeaders, MKT_RATE_LIMITS } from '@/lib/mkt/security';

type StreamingTextResult = {
  toTextStreamResponse: () => Response;
  toDataStreamResponse?: () => Response;
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const { id } = await params;
    const messages = await listChatByEstrategia(id, context);
    return withSecurityHeaders(Response.json({ messages }));
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await contextOrResponse(request);
  if (context instanceof Response) return context;

  const rl = checkRateLimit(`chat:${context.userId}:${context.companyId}`, MKT_RATE_LIMITS.chat ?? { windowMs: 60_000, maxRequests: 20 });
  if (!rl.allowed) return rateLimitResponse(rl);

  try {
    const { id } = await params;
    const estrategia = await getEstrategia(id, context);
    const body = await request.json();
    const { message } = body as { message?: string };

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return Response.json({ code: 'BAD_REQUEST', message: 'Message is required.' }, { status: 400 });
    }

    if (message.length > 2000) {
      return Response.json({ code: 'BAD_REQUEST', message: 'Message too long. Maximum 2000 characters.' }, { status: 400 });
    }

    const existingMessages = await listChatByEstrategia(id, context, 50);
    if (existingMessages.length >= 50) {
      return Response.json({ code: 'LIMIT_REACHED', message: 'Chat limit reached. Start a new session.' }, { status: 429 });
    }

    await saveChatMessage({
      estrategia_id: id,
      role: 'user',
      conteudo: message.trim(),
    });

    // Buscar contexto
    const { getDiagnosticoByEstrategia } = await import('@/lib/mkt/store');
    const diagnostico = await getDiagnosticoByEstrategia(id, context);
    
    const apiKey = process.env.ZAI_API_KEY || process.env.OPENAI_API_KEY || 'dummy';
    const baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';

    const { createOpenAI } = await import('@ai-sdk/openai');
    const { streamText } = await import('ai');

    const openai = createOpenAI({ apiKey, baseURL });
    
    const systemPrompt = `Você é um assistente especialista em marketing.
Contexto da Estratégia: ${estrategia.nome} (${estrategia.nicho})
Diagnóstico: ${diagnostico ? JSON.stringify({ swot: diagnostico.swot, uvp: diagnostico.uvp }) : 'Nenhum diagnóstico aprovado ainda.'}`;

    const coreMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...existingMessages.map(m => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.conteudo })),
      { role: 'user' as const, content: message.trim() }
    ];

    const result = streamText({
      model: openai(process.env.LLM_MODEL || 'gpt-4o'),
      messages: coreMessages,
      async onFinish({ text }) {
        await saveChatMessage({
          estrategia_id: id,
          role: 'assistant',
          conteudo: text,
        });
      }
    });

    const streamingResult = result as StreamingTextResult;
    const dataStreamResponse = streamingResult.toDataStreamResponse
      ? streamingResult.toDataStreamResponse()
      : streamingResult.toTextStreamResponse();
    // Injetar os headers
    const resHeaders = rateLimitHeaders(rl);
    for (const [k, v] of Object.entries(resHeaders)) dataStreamResponse.headers.set(k, v);
    return withSecurityHeaders(dataStreamResponse);
  } catch (error) {
    return jsonError(error);
  }
}
