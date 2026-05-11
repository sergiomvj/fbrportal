import type { ArvaAgent } from '@fbr/arva-integration';
import type { ClickAgent, ClickAgentActionLog, ClickDeal, ClickDealHistory, ClickKpi, ClickMessage, ClickTask } from './types';

const t = (offset = 0) => new Date(Date.now() - offset).toISOString();

export const clickDeals: ClickDeal[] = [
  {
    id: 'deal-1', workspaceId: 'empresa-1', userId: 'operator-1', empresaId: 'empresa-1',
    title: 'Expansao CRM FBR', companyName: 'Acme Vendas', contactName: 'Lia Souza',
    contactEmail: 'lia@acme.example', contactPhone: '+55 11 99999-0001',
    valueCents: 4200000, stage: 'contato_inicial', score: 86, source: 'fbr_leads',
    leadId: 'lead-1', priority: 'alta', activeAgentSlot: 'sdr', createdAt: t(86400000 * 2), updatedAt: t(3600000),
  },
  {
    id: 'deal-2', workspaceId: 'empresa-1', userId: 'operator-1', empresaId: 'empresa-1',
    title: 'Automacao comercial', companyName: 'Beta Tech', contactName: 'Rafael Lima',
    contactEmail: 'rafael@betatech.example', valueCents: 1800000, stage: 'proposta', score: 62,
    source: 'manual', priority: 'media', activeAgentSlot: 'proposta', createdAt: t(86400000 * 5), updatedAt: t(7200000),
  },
  {
    id: 'deal-3', workspaceId: 'empresa-1', userId: 'operator-2', empresaId: 'empresa-1',
    title: 'Consultoria dados', companyName: 'Gamma Data', contactName: 'Carla Mendes',
    contactEmail: 'carla@gammadata.example', contactPhone: '+55 21 98888-0002',
    valueCents: 3200000, stage: 'descoberta', score: 74, source: 'fbr_leads',
    leadId: 'lead-3', priority: 'alta', activeAgentSlot: 'qualificador', createdAt: t(86400000 * 3), updatedAt: t(14400000),
  },
  {
    id: 'deal-4', workspaceId: 'empresa-1', userId: 'operator-1', empresaId: 'empresa-1',
    title: 'Plataforma e-commerce', companyName: 'Delta Shop', contactName: 'Pedro Santos',
    contactEmail: 'pedro@deltashop.example', valueCents: 7500000, stage: 'negociacao', score: 91,
    source: 'fbr_leads', leadId: 'lead-4', priority: 'alta', activeAgentSlot: 'negociador',
    createdAt: t(86400000 * 7), updatedAt: t(1800000),
  },
  {
    id: 'deal-5', workspaceId: 'empresa-1', userId: 'operator-2', empresaId: 'empresa-1',
    title: 'App mobile fintech', companyName: 'Epsilon Pay', contactName: 'Ana Costa',
    contactEmail: 'ana@epsilonpay.example', contactPhone: '+55 31 97777-0003',
    valueCents: 5600000, stage: 'contato_inicial', score: 48, source: 'manual',
    priority: 'media', createdAt: t(86400000), updatedAt: t(86400000),
  },
  {
    id: 'deal-6', workspaceId: 'empresa-1', userId: 'operator-1', empresaId: 'empresa-1',
    title: 'Integracao ERP', companyName: 'Zeta Corp', contactName: 'Bruno Alves',
    contactEmail: 'bruno@zetacorp.example', valueCents: 9200000, stage: 'fechamento', score: 95,
    source: 'fbr_leads', leadId: 'lead-6', priority: 'alta', activeAgentSlot: 'closer',
    createdAt: t(86400000 * 10), updatedAt: t(600000),
  },
  {
    id: 'deal-7', workspaceId: 'empresa-1', userId: 'operator-2', empresaId: 'empresa-1',
    title: 'Migracao cloud', companyName: 'Eta Systems', contactName: 'Fernanda Rocha',
    contactEmail: 'fernanda@etasystems.example', valueCents: 6100000, stage: 'descoberta', score: 67,
    source: 'fbr_leads', leadId: 'lead-7', priority: 'media', activeAgentSlot: 'qualificador',
    createdAt: t(86400000 * 4), updatedAt: t(10800000),
  },
  {
    id: 'deal-8', workspaceId: 'empresa-1', userId: 'operator-1', empresaId: 'empresa-1',
    title: 'Portal clientes', companyName: 'Theta Servicos', contactName: 'Lucas Martins',
    contactEmail: 'lucas@thetaserv.example', contactPhone: '+55 41 96666-0004',
    valueCents: 2800000, stage: 'proposta', score: 55, source: 'manual',
    priority: 'baixa', createdAt: t(86400000 * 6), updatedAt: t(43200000),
  },
  {
    id: 'deal-9', workspaceId: 'empresa-1', userId: 'operator-2', empresaId: 'empresa-1',
    title: 'Analytics dashboard', companyName: 'Iota Insights', contactName: 'Mariana Lopes',
    contactEmail: 'mariana@iotainsights.example', valueCents: 1500000, stage: 'contato_inicial', score: 39,
    source: 'manual', priority: 'baixa', createdAt: t(3600000 * 2), updatedAt: t(3600000 * 2),
  },
  {
    id: 'deal-10', workspaceId: 'empresa-1', userId: 'operator-1', empresaId: 'empresa-1',
    title: 'Automacao marketing', companyName: 'Kappa Media', contactName: 'Diego Torres',
    contactEmail: 'diego@kappamedia.example', contactPhone: '+55 51 95555-0005',
    valueCents: 4800000, stage: 'negociacao', score: 82, source: 'fbr_leads',
    leadId: 'lead-10', priority: 'alta', activeAgentSlot: 'negociador',
    createdAt: t(86400000 * 8), updatedAt: t(900000),
  },
  {
    id: 'deal-11', workspaceId: 'empresa-1', userId: 'operator-2', empresaId: 'empresa-1',
    title: 'BI personalizado', companyName: 'Lambda Analytics', contactName: 'Patricia Gomes',
    contactEmail: 'patricia@lambdaanalytics.example', valueCents: 3900000, stage: 'descoberta', score: 71,
    source: 'fbr_leads', leadId: 'lead-11', priority: 'media', activeAgentSlot: 'qualificador',
    createdAt: t(86400000 * 2 + 3600000), updatedAt: t(5400000),
  },
  {
    id: 'deal-12', workspaceId: 'empresa-1', userId: 'operator-1', empresaId: 'empresa-1',
    title: 'Checkout personalizado', companyName: 'Mu Commerce', contactName: 'Thiago Barbosa',
    contactEmail: 'thiago@mucommerce.example', valueCents: 2200000, stage: 'fechamento', score: 88,
    source: 'fbr_leads', leadId: 'lead-12', priority: 'alta', activeAgentSlot: 'closer',
    createdAt: t(86400000 * 12), updatedAt: t(1200000),
  },
];

export const clickMessages: ClickMessage[] = [
  { id: 'msg-1', workspaceId: 'empresa-1', dealId: 'deal-1', authorId: 'operator-1', actorType: 'human', body: 'Contato inicial feito pelo WhatsApp. Prospect receptivo.', createdAt: t(3600000) },
  { id: 'msg-2', workspaceId: 'empresa-1', dealId: 'deal-1', authorId: 'agent-sdr', actorType: 'agent', body: 'Prospect classificado como SQL. Dores: CRM desatualizado, processo manual. Proximo passo: agendar discovery.', createdAt: t(3000000) },
  { id: 'msg-3', workspaceId: 'empresa-1', dealId: 'deal-2', authorId: 'operator-1', actorType: 'human', body: 'Proposta enviada por e-mail. Aguardando retorno do financeiro.', createdAt: t(7200000) },
  { id: 'msg-4', workspaceId: 'empresa-1', dealId: 'deal-2', authorId: 'agent-proposta', actorType: 'agent', body: 'Proposta gerada automaticamente com base no discovery. Valor sugerido: R$ 18.000.', createdAt: t(10800000) },
  { id: 'msg-5', workspaceId: 'empresa-1', dealId: 'deal-3', authorId: 'operator-2', actorType: 'human', body: 'Discovery agendado para amanha as 14h. Enviar questionario previo.', createdAt: t(14400000) },
  { id: 'msg-6', workspaceId: 'empresa-1', dealId: 'deal-4', authorId: 'agent-negociador', actorType: 'agent', body: 'Follow-up automatico: deal em negociacao ha 3 dias. Sugestao: oferecer desconto de 10% para fechamento esta semana.', createdAt: t(1800000) },
  { id: 'msg-7', workspaceId: 'empresa-1', dealId: 'deal-4', authorId: 'operator-1', actorType: 'human', body: 'Contrato enviado. Aguardando assinatura digital.', createdAt: t(900000) },
  { id: 'msg-8', workspaceId: 'empresa-1', dealId: 'deal-6', authorId: 'operator-1', actorType: 'human', body: 'Cliente confirmou interesse. Fechamento previsto para esta semana.', createdAt: t(600000) },
  { id: 'msg-9', workspaceId: 'empresa-1', dealId: 'deal-7', authorId: 'operator-2', actorType: 'human', body: 'Reuniao de discovery realizada. Principal dor: latencia no sistema atual.', createdAt: t(10800000) },
  { id: 'msg-10', workspaceId: 'empresa-1', dealId: 'deal-10', authorId: 'agent-negociador', actorType: 'agent', body: 'Analise de risco: deal com score 82. Probabilidade de fechamento: alta. Recomendacao: manter cadencia.', createdAt: t(900000) },
];

export const clickTasks: ClickTask[] = [
  { id: 'task-1', workspaceId: 'empresa-1', dealId: 'deal-1', title: 'Enviar diagnostico comercial', status: 'open', assigneeId: 'operator-1', dueAt: t(-86400000) },
  { id: 'task-2', workspaceId: 'empresa-1', dealId: 'deal-1', title: 'Validar decisor no cliente', status: 'done', assigneeId: 'agent-sdr' },
  { id: 'task-3', workspaceId: 'empresa-1', dealId: 'deal-2', title: 'Revisar proposta antes do envio', status: 'done', assigneeId: 'operator-1' },
  { id: 'task-4', workspaceId: 'empresa-1', dealId: 'deal-3', title: 'Preparar questionario discovery', status: 'open', assigneeId: 'operator-2', dueAt: t(-43200000) },
  { id: 'task-5', workspaceId: 'empresa-1', dealId: 'deal-4', title: 'Negociar termos contratuais', status: 'open', assigneeId: 'operator-1' },
  { id: 'task-6', workspaceId: 'empresa-1', dealId: 'deal-5', title: 'Agendar primeiro contato', status: 'open', assigneeId: 'operator-2', dueAt: t(-172800000) },
  { id: 'task-7', workspaceId: 'empresa-1', dealId: 'deal-6', title: 'Enviar contrato para assinatura', status: 'open', assigneeId: 'operator-1' },
  { id: 'task-8', workspaceId: 'empresa-1', dealId: 'deal-7', title: 'Levantar requisitos de migracao', status: 'open', assigneeId: 'operator-2', dueAt: t(-86400000 * 2) },
  { id: 'task-9', workspaceId: 'empresa-1', dealId: 'deal-8', title: 'Seguir proposta revisada', status: 'done', assigneeId: 'operator-1' },
  { id: 'task-10', workspaceId: 'empresa-1', dealId: 'deal-10', title: 'Preparar demo do produto', status: 'open', assigneeId: 'operator-1', dueAt: t(-3600000 * 6) },
  { id: 'task-11', workspaceId: 'empresa-1', dealId: 'deal-12', title: 'Confirmar dados de cobranca', status: 'open', assigneeId: 'operator-1' },
];

export const clickAgents: ClickAgent[] = [
  { id: 'agent-sdr', workspaceId: 'empresa-1', slot: 'sdr', arvaAgentId: 'arva-1', name: 'Comercial Bot', status: 'online', heartbeatAt: t(30000), paused: false },
  { id: 'agent-qualifier', workspaceId: 'empresa-1', slot: 'qualificador', arvaAgentId: 'arva-2', name: 'Discovery Bot', status: 'online', heartbeatAt: t(60000), paused: false },
  { id: 'agent-proposal', workspaceId: 'empresa-1', slot: 'proposta', arvaAgentId: 'arva-3', name: 'Proposta Bot', status: 'online', heartbeatAt: t(120000), paused: false },
  { id: 'agent-followup', workspaceId: 'empresa-1', slot: 'negociador', name: 'Follow-up Bot', status: 'online', heartbeatAt: t(45000), paused: false },
  { id: 'agent-briefer', workspaceId: 'empresa-1', slot: 'closer', name: 'Briefing Bot', status: 'offline', paused: false },
  { id: 'agent-handoff', workspaceId: 'empresa-1', slot: 'sucesso', name: 'Handoff Bot', status: 'error', paused: true },
];

export const clickKpis: ClickKpi[] = [
  { id: 'kpi-1', workspaceId: 'empresa-1', name: 'Deals ativos', value: 12, trend: 15 },
  { id: 'kpi-2', workspaceId: 'empresa-1', name: 'Receita prevista', value: 429000, trend: 22 },
  { id: 'kpi-3', workspaceId: 'empresa-1', name: 'Score medio', value: 73, trend: 5 },
  { id: 'kpi-4', workspaceId: 'empresa-1', name: 'Mensagens', value: 478, trend: 18 },
  { id: 'kpi-5', workspaceId: 'empresa-1', name: 'Tarefas abertas', value: 7, trend: -3 },
  { id: 'kpi-6', workspaceId: 'empresa-1', name: 'Agentes online', value: 4, trend: 33 },
];

export const clickHistory: ClickDealHistory[] = [
  { id: 'hist-1', workspaceId: 'empresa-1', dealId: 'deal-1', type: 'created', actorId: 'system', actorType: 'system', description: 'Deal criado automaticamente a partir do FBR-Leads (lead-1).', createdAt: t(86400000 * 2) },
  { id: 'hist-2', workspaceId: 'empresa-1', dealId: 'deal-1', type: 'agent_triggered', actorId: 'agent-sdr', actorType: 'agent', description: 'Comercial Bot acionado: primeiro contato em 47s.', createdAt: t(86400000 * 2 - 3600000) },
  { id: 'hist-3', workspaceId: 'empresa-1', dealId: 'deal-1', type: 'message_sent', actorId: 'operator-1', actorType: 'human', description: 'Mensagem registrada no deal.', createdAt: t(3600000) },
  { id: 'hist-4', workspaceId: 'empresa-1', dealId: 'deal-2', type: 'created', actorId: 'operator-1', actorType: 'human', description: 'Deal manual criado.', createdAt: t(86400000 * 5) },
  { id: 'hist-5', workspaceId: 'empresa-1', dealId: 'deal-2', type: 'stage_changed', actorId: 'operator-1', actorType: 'human', description: 'Estagio alterado de descoberta para proposta.', createdAt: t(86400000 * 4) },
  { id: 'hist-6', workspaceId: 'empresa-1', dealId: 'deal-3', type: 'created', actorId: 'system', actorType: 'system', description: 'Deal criado a partir do FBR-Leads (lead-3).', createdAt: t(86400000 * 3) },
  { id: 'hist-7', workspaceId: 'empresa-1', dealId: 'deal-4', type: 'created', actorId: 'system', actorType: 'system', description: 'Deal criado a partir do FBR-Leads (lead-4).', createdAt: t(86400000 * 7) },
  { id: 'hist-8', workspaceId: 'empresa-1', dealId: 'deal-4', type: 'stage_changed', actorId: 'operator-1', actorType: 'human', description: 'Estagio alterado de proposta para negociacao.', createdAt: t(86400000 * 3) },
  { id: 'hist-9', workspaceId: 'empresa-1', dealId: 'deal-6', type: 'created', actorId: 'system', actorType: 'system', description: 'Deal criado a partir do FBR-Leads (lead-6).', createdAt: t(86400000 * 10) },
  { id: 'hist-10', workspaceId: 'empresa-1', dealId: 'deal-6', type: 'stage_changed', actorId: 'operator-1', actorType: 'human', description: 'Estagio alterado de negociacao para fechamento.', createdAt: t(3600000 * 6) },
  { id: 'hist-11', workspaceId: 'empresa-1', dealId: 'deal-10', type: 'created', actorId: 'system', actorType: 'system', description: 'Deal criado a partir do FBR-Leads (lead-10).', createdAt: t(86400000 * 8) },
  { id: 'hist-12', workspaceId: 'empresa-1', dealId: 'deal-12', type: 'created', actorId: 'system', actorType: 'system', description: 'Deal criado a partir do FBR-Leads (lead-12).', createdAt: t(86400000 * 12) },
  { id: 'hist-13', workspaceId: 'empresa-1', dealId: 'deal-12', type: 'stage_changed', actorId: 'operator-1', actorType: 'human', description: 'Estagio alterado de negociacao para fechamento.', createdAt: t(1800000) },
];

export const clickActionLogs: ClickAgentActionLog[] = [
  { id: 'alog-1', workspaceId: 'empresa-1', dealId: 'deal-1', agentId: 'agent-sdr', action: 'first_contact', createdAt: t(86400000 * 2 - 3600000) },
  { id: 'alog-2', workspaceId: 'empresa-1', dealId: 'deal-3', agentId: 'agent-qualifier', action: 'discovery_questions', createdAt: t(86400000 * 3 - 7200000) },
  { id: 'alog-3', workspaceId: 'empresa-1', dealId: 'deal-2', agentId: 'agent-proposal', action: 'generate_proposal', createdAt: t(86400000 * 4) },
  { id: 'alog-4', workspaceId: 'empresa-1', dealId: 'deal-4', agentId: 'agent-followup', action: 'follow_up_cadence', createdAt: t(86400000 * 2) },
  { id: 'alog-5', workspaceId: 'empresa-1', dealId: 'deal-6', agentId: 'agent-briefer', action: 'prepare_briefing', createdAt: t(86400000) },
];

export const arvaClickAgents: ArvaAgent[] = [
  { id: 'arva-1', name: 'Comercial Bot', role: 'Primeiro contato em <2min', tags: ['comercial', 'vendas'], status: 'active' },
  { id: 'arva-2', name: 'Discovery Bot', role: 'Perguntas de descoberta', tags: ['comercial'], status: 'active' },
  { id: 'arva-3', name: 'Proposta Bot', role: 'Geracao de proposta', tags: ['vendas'], status: 'active' },
  { id: 'arva-4', name: 'Follow-up Bot', role: 'Cadencia para deals parados', tags: ['vendas', 'comercial'], status: 'active' },
  { id: 'arva-5', name: 'Briefing Bot', role: 'Resumo para vendedor', tags: ['comercial'], status: 'inactive' },
  { id: 'arva-6', name: 'Handoff Bot', role: 'Notificacao FBR-Sales', tags: ['vendas'], status: 'inactive' },
];
