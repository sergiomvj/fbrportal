import { contextOrResponse, jsonError } from '../../../_shared';
import {
  buildMktChatProactiveSuggestions,
  buildMktChatFallbackResponse,
  buildMktChatSystemPrompt,
  createMktChatTextDeltaStream,
  createMktChatSseStream,
  detectMktChatInconsistencyFlags,
  detectMktChatRefinementIntents,
  normalizeMktChatHistory,
  selectChatContextWindow,
  shouldQueueMktChatStrategyRefinement,
  type MktChatContext,
} from '@/lib/mkt/chat';
import { enqueueJob } from '@/lib/mkt/queue';
import { checkPersistentRateLimit, MKT_RATE_LIMITS, rateLimitHeaders, rateLimitResponse, withSecurityHeaders } from '@/lib/mkt/security';
import {
  getDiagnosticoByEstrategia,
  getMktChatContextCache,
  getEstrategia,
  listCalendarByEstrategia,
  listChatByEstrategia,
  listCopyByEstrategia,
  listLeadMagnetsByEstrategia,
  listRoadmapByEstrategia,
  listVersoes,
  saveMktChatContextCache,
  saveChatMessage,
  type MktRequestContext,
} from '@/lib/mkt/store';

type StreamingTextResult = {
  textStream?: AsyncIterable<string>;
  toTextStreamResponse: () => Response;
};

type CachedChatOperationalContext = Omit<MktChatContext, 'history'>;
const CHAT_CONTEXT_CACHE_TTL_MS = 30 * 60 * 1000;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const { id } = await params;
    const searchParams = new URL(request.url).searchParams;
    const limitParam = searchParams.get('limit');
    const before = searchParams.get('before') ?? undefined;
    const limit = Math.min(Math.max(Number(limitParam ?? 50) || 50, 1), 50);
    const listOptions = before ? { limit: limit + 1, before } : { limit: limit + 1 };
    const page = normalizeMktChatHistory(await listChatByEstrategia(id, context, listOptions));
    const hasMore = page.length > limit;
    const messages = hasMore ? page.slice(1) : page;
    const chatContext = await loadChatOperationalContext(id, context, selectChatContextWindow(messages));
    return withSecurityHeaders(Response.json({
      messages,
      suggestions: buildMktChatProactiveSuggestions(chatContext),
      inconsistencyFlags: detectMktChatInconsistencyFlags(chatContext),
      pagination: {
        limit,
        returned: messages.length,
        before: before ?? null,
        nextBefore: hasMore ? messages[0]?.created_at ?? null : null,
        hasMore,
      },
    }));
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

  const { id } = await params;
  const rl = await checkPersistentRateLimit(`chat:${context.userId}:${context.companyId}:${id}`, MKT_RATE_LIMITS.chat ?? { windowMs: 60_000, maxRequests: 10 });
  if (!rl.allowed) return rateLimitResponse(rl);

  try {
    const estrategia = await getEstrategia(id, context);
    const body = await request.json();
    const { message } = body as { message?: string };

    if (estrategia.status === 'arquivada') {
      return Response.json({ code: 'STRATEGY_ARCHIVED', message: 'Archived strategies cannot use chat.' }, { status: 401 });
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return Response.json({ code: 'BAD_REQUEST', message: 'Message is required.' }, { status: 400 });
    }

    if (message.length > 2000) {
      return Response.json({ code: 'BAD_REQUEST', message: 'Message too long. Maximum 2000 characters.' }, { status: 400 });
    }

    const existingMessages = normalizeMktChatHistory(await listChatByEstrategia(id, context, 50));
    const requiredSlotsForTurn = 2;
    if (existingMessages.length > 50 - requiredSlotsForTurn) {
      return Response.json({ code: 'LIMIT_REACHED', message: 'Chat limit reached. Start a new session.' }, { status: 429 });
    }

    await saveChatMessage({
      estrategia_id: id,
      role: 'user',
      conteudo: message.trim(),
    });

    const contextWindow = selectChatContextWindow(existingMessages);
    const chatContext = await loadChatOperationalContext(id, context, contextWindow, estrategia);
    const systemPrompt = buildMktChatSystemPrompt(chatContext);
    await enqueueStrategyRefinementFromChat(id, context, chatContext, message.trim());

    const apiKey = process.env.ZAI_API_KEY || process.env.OPENAI_API_KEY || '';
    const baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';

    if (!apiKey.trim()) {
      const fallbackText = buildMktChatFallbackResponse({
        context: chatContext,
        message,
      });

      await saveChatMessage({
        estrategia_id: id,
        role: 'assistant',
        conteudo: fallbackText,
      });

      const fallbackResponse = createChatSseResponse(createMktChatTextDeltaStream(fallbackText));
      const headers = rateLimitHeaders(rl);
      for (const [key, value] of Object.entries(headers)) fallbackResponse.headers.set(key, value);
      return withSecurityHeaders(fallbackResponse);
    }

    const { createOpenAI } = await import('@ai-sdk/openai');
    const { streamText } = await import('ai');
    const openai = createOpenAI({ apiKey, baseURL });

    const result = streamText({
      model: openai(process.env.LLM_MODEL || 'gpt-4o'),
      messages: [
        { role: 'system' as const, content: systemPrompt },
        ...contextWindow.map((item) => ({ role: item.role, content: item.conteudo })),
        { role: 'user' as const, content: message.trim() },
      ],
      async onFinish({ text }) {
        await saveChatMessage({
          estrategia_id: id,
          role: 'assistant',
          conteudo: text,
        });
      },
    });

    const streamingResult = result as StreamingTextResult;
    const textStream = streamingResult.textStream ?? textResponseToAsyncIterable(streamingResult.toTextStreamResponse());
    const response = createChatSseResponse(textStream);

    const headers = rateLimitHeaders(rl);
    for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
    return withSecurityHeaders(response);
  } catch (error) {
    return jsonError(error);
  }
}

function createChatSseResponse(textStream: AsyncIterable<string>) {
  return new Response(createMktChatSseStream(textStream), {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}

async function* textResponseToAsyncIterable(response: Response): AsyncIterable<string> {
  const reader = response.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    if (chunk) yield chunk;
  }

  const rest = decoder.decode();
  if (rest) yield rest;
}

async function loadChatOperationalContext(
  estrategiaId: string,
  context: MktRequestContext,
  history: MktChatContext['history'],
  estrategia?: MktChatContext['estrategia'],
): Promise<MktChatContext> {
  const resolvedEstrategia = estrategia ?? await getEstrategia(estrategiaId, context);
  const cached = await getMktChatContextCache(estrategiaId, context);
  if (cached && isCachedChatOperationalContext(cached.payload, estrategiaId, context.companyId, resolvedEstrategia)) {
    return {
      ...cached.payload,
      estrategia: resolvedEstrategia,
      history,
    };
  }

  const [diagnostico, versoes, copy, leadMagnets, calendario, roadmap] = await Promise.all([
    getDiagnosticoByEstrategia(estrategiaId, context),
    listVersoes(estrategiaId, context),
    listCopyByEstrategia(estrategiaId, context),
    listLeadMagnetsByEstrategia(estrategiaId, context),
    listCalendarByEstrategia(estrategiaId, context),
    listRoadmapByEstrategia(estrategiaId, context),
  ]);

  const operationalContext: CachedChatOperationalContext = {
    estrategia: resolvedEstrategia,
    diagnostico,
    versao: versoes[0] ?? null,
    copy,
    leadMagnets,
    calendario,
    roadmap,
  };

  await saveMktChatContextCache(estrategiaId, context, operationalContext, CHAT_CONTEXT_CACHE_TTL_MS);

  return {
    ...operationalContext,
    history,
  };
}

function isCachedChatOperationalContext(
  payload: unknown,
  estrategiaId: string,
  companyId: string,
  activeEstrategia: MktChatContext['estrategia'],
): payload is CachedChatOperationalContext {
  if (!payload || typeof payload !== 'object') return false;
  const value = payload as Partial<CachedChatOperationalContext>;
  const activeVersion = activeEstrategia.versao ?? 0;
  return (
    value.estrategia?.id === estrategiaId
    && value.estrategia.empresa_id === companyId
    && (value.estrategia.versao ?? 0) === activeVersion
    && (value.versao?.versao ?? activeVersion) === activeVersion
    && 'diagnostico' in value
    && 'versao' in value
    && Array.isArray(value.copy)
    && Array.isArray(value.leadMagnets)
    && Array.isArray(value.calendario)
    && Array.isArray(value.roadmap)
  );
}

async function enqueueStrategyRefinementFromChat(
  estrategiaId: string,
  context: MktRequestContext,
  chatContext: MktChatContext,
  message: string,
) {
  const refinementIntents = detectMktChatRefinementIntents(message);
  if (!shouldQueueMktChatStrategyRefinement(message, refinementIntents)) return null;

  const currentVersion = chatContext.versao?.versao ?? chatContext.estrategia.versao ?? 0;
  const job = await enqueueJob('geracao_estrategia', estrategiaId, context.companyId, {
    regenerar: true,
    source: 'chat',
    versao: currentVersion + 1,
    requested_by: context.userId,
    refinement_intents: refinementIntents,
    message,
    context_version: currentVersion,
    preserve_historical_versions: true,
  });

  return job;
}
