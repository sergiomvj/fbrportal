import { resolveArvaConfig } from './config';
import { ArvaIntegrationError, toArvaError } from './errors';
import type { AgentIdentity, ArvaAgent, ArvaClientConfig, OpenChatResult } from './types';

interface ArvaAgentResponse {
  agents?: unknown;
  data?: unknown;
}

function endpoint(baseUrl: string, pathname: string): string {
  return `${baseUrl}${pathname}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function assertString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new ArvaIntegrationError({
      code: 'ARVA_MALFORMED_PAYLOAD',
      message: `Arva response is missing ${field}.`,
    });
  }

  return value;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((tag): tag is string => typeof tag === 'string' && tag.length > 0);
}

function normalizeStatus(value: unknown): 'active' | 'inactive' {
  return value === 'active' ? 'active' : 'inactive';
}

export function parseArvaAgent(value: unknown): ArvaAgent {
  if (!isRecord(value)) {
    throw new ArvaIntegrationError({
      code: 'ARVA_MALFORMED_PAYLOAD',
      message: 'Arva agent payload must be an object.',
    });
  }

  const runtime = isRecord(value.runtime)
    ? {
        status: normalizeStatus(value.runtime.status),
        heartbeatAt: optionalString(value.runtime.heartbeatAt),
        tags: normalizeTags(value.runtime.tags ?? value.tags),
      }
    : undefined;

  return {
    id: assertString(value.id, 'agent.id'),
    fbrchatId: optionalString(value.fbrchatId),
    avatarUrl: optionalString(value.avatarUrl),
    name: assertString(value.name, 'agent.name'),
    role: assertString(value.role, 'agent.role'),
    tags: normalizeTags(value.tags),
    status: normalizeStatus(value.status),
    persona: isRecord(value.persona)
      ? {
          role: assertString(value.persona.role ?? value.role, 'agent.persona.role'),
          tone: optionalString(value.persona.tone),
          description: optionalString(value.persona.description),
        }
      : undefined,
    runtime,
    performance: isRecord(value.performance)
      ? {
          successRate: typeof value.performance.successRate === 'number' ? value.performance.successRate : undefined,
          avgResponseMs: typeof value.performance.avgResponseMs === 'number' ? value.performance.avgResponseMs : undefined,
          totalConversations:
            typeof value.performance.totalConversations === 'number' ? value.performance.totalConversations : undefined,
        }
      : undefined,
  };
}

function parseAgentIdentity(value: unknown, fallbackFbrchatId: string): AgentIdentity {
  if (!isRecord(value)) {
    throw new ArvaIntegrationError({
      code: 'ARVA_MALFORMED_PAYLOAD',
      message: 'Arva identity payload must be an object.',
    });
  }

  const persona = isRecord(value.persona) ? value.persona : {};
  const runtime = isRecord(value.runtime) ? value.runtime : {};

  return {
    agentId: assertString(value.agentId ?? value.id, 'identity.agentId'),
    fbrchatId: assertString(value.fbrchatId ?? fallbackFbrchatId, 'identity.fbrchatId'),
    displayName: assertString(value.displayName ?? value.name, 'identity.displayName'),
    persona: {
      role: assertString(persona.role ?? value.role, 'identity.persona.role'),
      tone: optionalString(persona.tone),
      description: optionalString(persona.description),
    },
    runtime: {
      status: normalizeStatus(runtime.status ?? value.status),
      heartbeatAt: optionalString(runtime.heartbeatAt),
      tags: normalizeTags(runtime.tags ?? value.tags),
    },
    performance: isRecord(value.performance)
      ? {
          successRate: typeof value.performance.successRate === 'number' ? value.performance.successRate : undefined,
          avgResponseMs: typeof value.performance.avgResponseMs === 'number' ? value.performance.avgResponseMs : undefined,
          totalConversations:
            typeof value.performance.totalConversations === 'number' ? value.performance.totalConversations : undefined,
        }
      : undefined,
  };
}

function parseOpenChat(value: unknown, agentId: string, userId: string): OpenChatResult {
  if (!isRecord(value)) {
    throw new ArvaIntegrationError({
      code: 'ARVA_MALFORMED_PAYLOAD',
      message: 'Arva chat payload must be an object.',
    });
  }

  return {
    chatId: assertString(value.chatId ?? value.id, 'chat.chatId'),
    url: optionalString(value.url),
    agentId,
    userId,
  };
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch (error) {
    throw new ArvaIntegrationError({
      code: 'ARVA_MALFORMED_PAYLOAD',
      message: 'Arva response was not valid JSON.',
      status: response.status,
      cause: error,
    });
  }
}

async function requestJson(url: string, init: RequestInit, fetcher: typeof fetch): Promise<unknown> {
  try {
    const response = await fetcher(url, init);
    const body = await readJson(response);

    if (!response.ok) {
      const message = isRecord(body) && typeof body.message === 'string' ? body.message : 'Arva API request failed.';
      throw new ArvaIntegrationError({
        code: 'ARVA_API_ERROR',
        message,
        status: response.status,
      });
    }

    return body;
  } catch (error) {
    throw toArvaError(error);
  }
}

export async function listAgents(companyId: string, config: ArvaClientConfig = {}): Promise<ArvaAgent[]> {
  if (!companyId) {
    throw new ArvaIntegrationError({
      code: 'ARVA_COMPANY_ID_MISSING',
      message: 'companyId is required.',
    });
  }

  const resolved = resolveArvaConfig(config);
  const url = endpoint(resolved.baseUrl, `/api/agents?company_id=${encodeURIComponent(companyId)}`);
  const body = (await requestJson(url, { method: 'GET' }, resolved.fetcher)) as ArvaAgentResponse;
  const agents = isRecord(body) ? body.agents ?? body.data : body;

  if (!Array.isArray(agents)) {
    throw new ArvaIntegrationError({
      code: 'ARVA_MALFORMED_PAYLOAD',
      message: 'Arva agents response must contain an agents array.',
    });
  }

  return agents.map(parseArvaAgent);
}

export async function resolveAgent(fbrchatId: string, config: ArvaClientConfig = {}): Promise<AgentIdentity> {
  if (!fbrchatId) {
    throw new ArvaIntegrationError({
      code: 'ARVA_FBRCHAT_ID_MISSING',
      message: 'fbrchatId is required.',
    });
  }

  const resolved = resolveArvaConfig(config);
  const body = await requestJson(
    endpoint(resolved.baseUrl, '/api/integrations/fbrchat/resolve-agent'),
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ fbrchatId }),
    },
    resolved.fetcher,
  );

  return parseAgentIdentity(isRecord(body) ? body.agent ?? body.data ?? body : body, fbrchatId);
}

export async function openChat(agentId: string, userId: string, config: ArvaClientConfig = {}): Promise<OpenChatResult> {
  if (!agentId || !userId) {
    throw new ArvaIntegrationError({
      code: 'ARVA_CHAT_INPUT_MISSING',
      message: 'agentId and userId are required.',
    });
  }

  const resolved = resolveArvaConfig(config);
  const body = await requestJson(
    endpoint(resolved.baseUrl, '/api/integrations/arva/chat/open'),
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ agentId, userId }),
    },
    resolved.fetcher,
  );

  return parseOpenChat(isRecord(body) ? body.chat ?? body.data ?? body : body, agentId, userId);
}
