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
  const context = contextOrResponse(request);
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

    const userMsg = await saveChatMessage({
      estrategia_id: id,
      role: 'user',
      conteudo: message.trim(),
    });

    // Buscar contexto
    const { getDiagnosticoByEstrategia } = await import('@/lib/mkt/store');
    const diagnostico = await getDiagnosticoByEstrategia(id, context);
    
    let assistantReply = 'Desculpe, o servico de IA esta indisponivel no momento.';
    
    try {
      const apiKey = process.env.ZAI_API_KEY || process.env.OPENAI_API_KEY;
      const apiUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1/chat/completions';
      
      if (apiKey) {
        const systemPrompt = `Você é um assistente especialista em marketing.
Contexto da Estratégia: ${estrategia.nome} (${estrategia.nicho})
Diagnóstico: ${diagnostico ? JSON.stringify({ swot: diagnostico.swot, uvp: diagnostico.uvp }) : 'Nenhum diagnóstico aprovado ainda.'}`;

        const llmRes = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: process.env.LLM_MODEL || 'gpt-4o',
            messages: [
              { role: 'system', content: systemPrompt },
              ...existingMessages.map(m => ({ role: m.role, content: m.conteudo })),
              { role: 'user', content: message.trim() }
            ]
          })
        });

        if (llmRes.ok) {
          const llmData = await llmRes.json();
          assistantReply = llmData.choices[0].message.content;
        } else {
          console.error('LLM API Error:', await llmRes.text());
        }
      } else {
        assistantReply = `Recebi sua mensagem: "${message.trim()}". O assistente contextual MKT está pronto, mas a chave da API do LLM não está configurada no ambiente.`;
      }
    } catch (e) {
      console.error('LLM fetch failed', e);
    }

    const assistantMsg = await saveChatMessage({
      estrategia_id: id,
      role: 'assistant',
      conteudo: assistantReply,
    });

    const resp = Response.json({ user_message: userMsg, assistant_message: assistantMsg });
    const headers = rateLimitHeaders(rl);
    for (const [k, v] of Object.entries(headers)) resp.headers.set(k, v);
    return withSecurityHeaders(resp);
  } catch (error) {
    return jsonError(error);
  }
}
