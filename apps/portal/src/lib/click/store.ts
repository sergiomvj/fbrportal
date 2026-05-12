import { z } from 'zod';
import { checkRateLimit, resetRateLimitForTests } from '@/lib/rate-limit';
import { clickAgents, clickDeals, clickHistory, clickKpis, clickMessages, clickTasks } from './fixtures';
import { createDealSchema, leadQualifiedEventSchema, messageSchema, normalizeLeadQualified, taskSchema } from './schemas';
import type { ClickAgent, ClickDeal, ClickDealHistory, ClickMessage, ClickTask, ClickUserRole } from './types';

export interface ClickRequestContext {
  userId: string;
  workspaceId: string;
  role: ClickUserRole;
  moduleSource: string;
}

let deals: ClickDeal[] = [];
let messages: ClickMessage[] = [];
let tasks: ClickTask[] = [];
let agents: ClickAgent[] = [];
let history: ClickDealHistory[] = [];

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function now() {
  return new Date().toISOString();
}

function id(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function resetClickStoreForTests() {
  deals = clone(clickDeals);
  messages = clone(clickMessages);
  tasks = clone(clickTasks);
  agents = clone(clickAgents);
  history = clone(clickHistory);
  resetRateLimitForTests();
}

resetClickStoreForTests();

export function contextFromHeaders(
  headers: Headers,
  fallbackModuleSource = 'click',
): ClickRequestContext | Response {
  const userId = headers.get('x-user-id');
  const workspaceId = headers.get('x-workspace-id') ?? headers.get('x-company-id') ?? headers.get('x-empresa-id');
  const role = (headers.get('x-user-role') ?? 'operator').toLowerCase();
  const moduleSource = headers.get('x-module-source') ?? fallbackModuleSource;

  if (!userId || !workspaceId) {
    return Response.json({ code: 'UNAUTHORIZED_CONTEXT', message: 'X-User-Id and workspace headers are required.' }, { status: 401 });
  }

  return { userId, workspaceId, role: role === 'admin' ? 'admin' : 'operator', moduleSource };
}

export function listDeals(context: ClickRequestContext) {
  return deals.filter((deal) => deal.workspaceId === context.workspaceId);
}

export function getDeal(context: ClickRequestContext, dealId: string) {
  return listDeals(context).find((deal) => deal.id === dealId) ?? null;
}

export function createManualDeal(context: ClickRequestContext, input: unknown) {
  const payload = createDealSchema.parse(input);
  const createdAt = now();
  const deal: ClickDeal = {
    id: id('deal'),
    workspaceId: context.workspaceId,
    userId: context.userId,
    empresaId: context.workspaceId,
    title: payload.title,
    companyName: payload.companyName,
    valueCents: payload.valueCents,
    stage: payload.stage,
    score: payload.score,
    source: payload.source,
    priority: payload.priority,
    createdAt,
    updatedAt: createdAt,
    ...(payload.contactName ? { contactName: payload.contactName } : {}),
    ...(payload.contactEmail ? { contactEmail: payload.contactEmail } : {}),
    ...(payload.contactPhone ? { contactPhone: payload.contactPhone } : {}),
  };

  deals.push(deal);
  appendHistory(context, deal.id, 'created', 'Deal manual criado.', { source: 'manual' });
  return deal;
}

export function createDealFromLead(context: ClickRequestContext, input: unknown) {
  const payload = leadQualifiedEventSchema.parse(input).data;
  const existing = deals.find((deal) => deal.workspaceId === context.workspaceId && deal.leadId === payload.lead_id);

  if (existing) {
    return { deal: existing, created: false };
  }

  const normalized = normalizeLeadQualified(payload);
  const createdAt = now();
  const deal: ClickDeal = {
    id: id('deal'),
    workspaceId: context.workspaceId,
    userId: context.userId,
    empresaId: context.workspaceId,
    title: normalized.title,
    companyName: normalized.companyName,
    valueCents: normalized.valueCents,
    stage: normalized.stage,
    score: normalized.score,
    source: 'fbr_leads',
    priority: normalized.priority,
    leadId: payload.lead_id,
    createdAt,
    updatedAt: createdAt,
    ...(normalized.contactName ? { contactName: normalized.contactName } : {}),
    ...(normalized.contactEmail ? { contactEmail: normalized.contactEmail } : {}),
  };

  deals.push(deal);
  appendHistory(context, deal.id, 'created', 'lead.qualified recebido do FBR-Leads.', {
    moduleSource: context.moduleSource,
    leadId: payload.lead_id,
  });

  return { deal, created: true };
}

export function moveDealStage(context: ClickRequestContext, dealId: string, input: unknown) {
  const payload = z.object({ stage: createDealSchema.shape.stage }).parse(input);
  const deal = getDeal(context, dealId);

  if (!deal) {
    return null;
  }

  const previousStage = deal.stage;
  deal.stage = payload.stage;
  deal.updatedAt = now();
  appendHistory(context, deal.id, 'stage_changed', `Estagio alterado de ${previousStage} para ${payload.stage}.`, {
    previousStage,
    nextStage: payload.stage,
  });

  return deal;
}

export function listMessages(context: ClickRequestContext, dealId: string) {
  if (!getDeal(context, dealId)) {
    return null;
  }

  return messages.filter((message) => message.workspaceId === context.workspaceId && message.dealId === dealId);
}

export function createMessage(context: ClickRequestContext, dealId: string, input: unknown) {
  if (!getDeal(context, dealId)) {
    return null;
  }

  const payload = messageSchema.parse(input);
  const message: ClickMessage = {
    id: id('message'),
    workspaceId: context.workspaceId,
    dealId,
    authorId: context.userId,
    actorType: payload.actorType,
    body: payload.body,
    createdAt: now(),
  };

  messages.push(message);
  appendHistory(context, dealId, 'message_sent', 'Mensagem registrada no deal.', { actorType: payload.actorType });
  return message;
}

export function listTasks(context: ClickRequestContext, dealId: string) {
  if (!getDeal(context, dealId)) {
    return null;
  }

  return tasks.filter((task) => task.workspaceId === context.workspaceId && task.dealId === dealId);
}

export function upsertTask(context: ClickRequestContext, dealId: string, input: unknown) {
  if (!getDeal(context, dealId)) {
    return null;
  }

  const payload = taskSchema.parse(input);
  const task: ClickTask = {
    id: id('task'),
    workspaceId: context.workspaceId,
    dealId,
    title: payload.title,
    status: payload.status,
  };

  tasks.push(task);
  appendHistory(context, dealId, 'task_updated', `Tarefa ${payload.status}.`, { title: payload.title });
  return task;
}

export function listAgents(context: ClickRequestContext) {
  return agents.filter((agent) => agent.workspaceId === context.workspaceId);
}

export function triggerAgent(context: ClickRequestContext, dealId: string, agentId: string) {
  const deal = getDeal(context, dealId);
  const agent = listAgents(context).find((item) => item.id === agentId || item.slot === agentId);

  if (!deal) {
    return { status: 404 as const, body: { code: 'DEAL_NOT_FOUND', message: 'Deal not found.' } };
  }

  if (!agent || agent.status !== 'online' || agent.paused) {
    return { status: 503 as const, body: { code: 'AGENT_UNAVAILABLE', message: 'Agent unavailable.' } };
  }

  const limit = checkRateLimit(`${context.workspaceId}:${dealId}:${agent.id}`, 1, 30_000);
  if (!limit.allowed) {
    return { status: 429 as const, body: { code: 'DUPLICATE_TRIGGER', message: 'Agent already triggered recently.' } };
  }

  appendHistory(context, dealId, 'agent_triggered', `${agent.name} acionado.`, { agentId: agent.id, slot: agent.slot });
  return { status: 202 as const, body: { accepted: true, agent } };
}

export function setAgentPaused(context: ClickRequestContext, agentId: string, paused: boolean) {
  if (context.role !== 'admin') {
    return { status: 403 as const, body: { code: 'ADMIN_REQUIRED', message: 'Admin role required.' } };
  }

  const agent = listAgents(context).find((item) => item.id === agentId);
  if (!agent) {
    return { status: 404 as const, body: { code: 'AGENT_NOT_FOUND', message: 'Agent not found.' } };
  }

  agent.paused = paused;
  return { status: 200 as const, body: { agent } };
}

export function listAudit(context: ClickRequestContext, dealId?: string | null) {
  return history.filter((item) => item.workspaceId === context.workspaceId && (!dealId || item.dealId === dealId));
}

export function exportAuditCsv(context: ClickRequestContext) {
  const rows = listAudit(context);
  return [
    'id,deal_id,type,actor_type,description,created_at',
    ...rows.map((row) =>
      [row.id, row.dealId, row.type, row.actorType, row.description.replaceAll('"', '""'), row.createdAt]
        .map((cell) => `"${cell}"`)
        .join(','),
    ),
  ].join('\n');
}

export function getKpis(context: ClickRequestContext) {
  return clickKpis.filter((kpi) => kpi.workspaceId === context.workspaceId);
}

function appendHistory(
  context: ClickRequestContext,
  dealId: string,
  type: ClickDealHistory['type'],
  description: string,
  metadata?: Record<string, unknown>,
) {
  history.push({
    id: id('history'),
    workspaceId: context.workspaceId,
    dealId,
    type,
    actorId: context.userId,
    actorType: 'human',
    description,
    createdAt: now(),
    ...(metadata ? { metadata } : {}),
  });
}
