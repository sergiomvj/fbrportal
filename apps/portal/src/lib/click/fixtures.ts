import type { ArvaAgent } from '@fbr/arva-integration';
import type { ClickAgent, ClickDeal, ClickDealHistory, ClickKpi, ClickMessage, ClickTask } from './types';

const now = '2026-05-03T12:00:00.000Z';

export const clickDeals: ClickDeal[] = [
  {
    id: 'deal-1',
    workspaceId: 'empresa-1',
    userId: 'operator-1',
    empresaId: 'empresa-1',
    title: 'Expansao CRM FBR',
    companyName: 'Acme Vendas',
    contactName: 'Lia Souza',
    contactEmail: 'lia@acme.example',
    contactPhone: '+55 11 99999-0000',
    valueCents: 4200000,
    stage: 'contato_inicial',
    score: 86,
    source: 'fbr_leads',
    leadId: 'lead-1',
    priority: 'alta',
    activeAgentSlot: 'sdr',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'deal-2',
    workspaceId: 'empresa-1',
    userId: 'operator-1',
    empresaId: 'empresa-1',
    title: 'Automacao comercial',
    companyName: 'Beta Tech',
    contactName: 'Rafael Lima',
    valueCents: 1800000,
    stage: 'proposta',
    score: 62,
    source: 'manual',
    priority: 'media',
    activeAgentSlot: 'proposta',
    createdAt: now,
    updatedAt: now,
  },
];

export const clickMessages: ClickMessage[] = [
  {
    id: 'message-1',
    workspaceId: 'empresa-1',
    dealId: 'deal-1',
    authorId: 'operator-1',
    actorType: 'human',
    body: 'Contato inicial feito pelo WhatsApp.',
    createdAt: now,
  },
  {
    id: 'message-2',
    workspaceId: 'empresa-1',
    dealId: 'deal-1',
    authorId: 'agent-sdr',
    actorType: 'agent',
    body: 'AGENTE: resumo de dores comerciais identificado.',
    createdAt: now,
  },
];

export const clickTasks: ClickTask[] = [
  { id: 'task-1', workspaceId: 'empresa-1', dealId: 'deal-1', title: 'Enviar diagnostico', status: 'open' },
  { id: 'task-2', workspaceId: 'empresa-1', dealId: 'deal-1', title: 'Validar decisor', status: 'done' },
];

export const clickAgents: ClickAgent[] = [
  { id: 'agent-sdr', workspaceId: 'empresa-1', slot: 'sdr', arvaAgentId: 'arva-1', name: 'SDR IA', status: 'online', heartbeatAt: now, paused: false },
  { id: 'agent-qualifier', workspaceId: 'empresa-1', slot: 'qualificador', arvaAgentId: 'arva-2', name: 'Qualificador', status: 'online', heartbeatAt: now, paused: false },
  { id: 'agent-proposal', workspaceId: 'empresa-1', slot: 'proposta', arvaAgentId: 'arva-3', name: 'Proposta IA', status: 'offline', paused: false },
  { id: 'agent-negotiator', workspaceId: 'empresa-1', slot: 'negociador', name: 'Negociador', status: 'offline', paused: false },
  { id: 'agent-closer', workspaceId: 'empresa-1', slot: 'closer', name: 'Closer', status: 'error', paused: true },
  { id: 'agent-success', workspaceId: 'empresa-1', slot: 'sucesso', name: 'Sucesso', status: 'offline', paused: false },
];

export const clickKpis: ClickKpi[] = [
  { id: 'kpi-1', workspaceId: 'empresa-1', name: 'Deals ativos', value: 24, trend: 8 },
  { id: 'kpi-2', workspaceId: 'empresa-1', name: 'Receita prevista', value: 182000, trend: 11 },
  { id: 'kpi-3', workspaceId: 'empresa-1', name: 'Score medio', value: 74, trend: 3 },
  { id: 'kpi-4', workspaceId: 'empresa-1', name: 'Mensagens', value: 318, trend: 16 },
  { id: 'kpi-5', workspaceId: 'empresa-1', name: 'Tarefas abertas', value: 12, trend: -2 },
  { id: 'kpi-6', workspaceId: 'empresa-1', name: 'Agentes online', value: 2, trend: 1 },
];

export const clickHistory: ClickDealHistory[] = [
  {
    id: 'history-1',
    workspaceId: 'empresa-1',
    dealId: 'deal-1',
    type: 'created',
    actorId: 'operator-1',
    actorType: 'human',
    description: 'Deal criado a partir do FBR-Leads.',
    createdAt: now,
  },
];

export const arvaClickAgents: ArvaAgent[] = [
  { id: 'arva-1', name: 'SDR IA', role: 'Pesquisa e primeiro contato', tags: ['comercial', 'vendas'], status: 'active' },
  { id: 'arva-2', name: 'Qualificador', role: 'ICP e descoberta', tags: ['comercial'], status: 'active' },
  { id: 'arva-3', name: 'Proposta IA', role: 'Propostas comerciais', tags: ['vendas'], status: 'inactive' },
  { id: 'arva-4', name: 'Suporte IA', role: 'Atendimento tecnico', tags: ['suporte'], status: 'active' },
];

