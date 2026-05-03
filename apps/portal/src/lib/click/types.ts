export const clickStages = ['contato_inicial', 'descoberta', 'proposta', 'negociacao', 'fechamento'] as const;
export const clickSources = ['fbr_leads', 'manual'] as const;
export const clickPriorities = ['baixa', 'media', 'alta'] as const;
export const clickAgentSlots = ['sdr', 'qualificador', 'proposta', 'negociador', 'closer', 'sucesso'] as const;

export type ClickStage = (typeof clickStages)[number];
export type ClickSource = (typeof clickSources)[number];
export type ClickPriority = (typeof clickPriorities)[number];
export type ClickAgentSlot = (typeof clickAgentSlots)[number];
export type ClickUserRole = 'admin' | 'operator';
export type ClickActorType = 'human' | 'agent' | 'system';

export interface ClickWorkspace {
  id: string;
  name: string;
  createdAt: string;
}

export interface ClickUser {
  id: string;
  workspaceId: string;
  email: string;
  role: ClickUserRole;
}

export interface ClickSpace {
  id: string;
  workspaceId: string;
  name: string;
}

export interface ClickChannel {
  id: string;
  workspaceId: string;
  spaceId: string;
  type: 'whatsapp' | 'email' | 'internal';
  name: string;
}

export interface ClickMessage {
  id: string;
  workspaceId: string;
  dealId: string;
  authorId: string;
  actorType: ClickActorType;
  body: string;
  createdAt: string;
}

export interface ClickTask {
  id: string;
  workspaceId: string;
  dealId: string;
  title: string;
  status: 'open' | 'done';
  assigneeId?: string;
  dueAt?: string;
}

export interface ClickDeal {
  id: string;
  workspaceId: string;
  userId: string;
  empresaId: string;
  title: string;
  companyName: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  valueCents: number;
  stage: ClickStage;
  score: number;
  source: ClickSource;
  leadId?: string;
  priority: ClickPriority;
  activeAgentSlot?: ClickAgentSlot;
  createdAt: string;
  updatedAt: string;
}

export interface ClickDealHistory {
  id: string;
  workspaceId: string;
  dealId: string;
  type: 'created' | 'stage_changed' | 'message_sent' | 'task_updated' | 'agent_triggered';
  actorId: string;
  actorType: ClickActorType;
  description: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface ClickAgent {
  id: string;
  workspaceId: string;
  slot: ClickAgentSlot;
  arvaAgentId?: string;
  name: string;
  status: 'online' | 'offline' | 'error';
  heartbeatAt?: string;
  paused: boolean;
}

export interface ClickAgentMarkdownCache {
  id: string;
  workspaceId: string;
  agentId: string;
  markdown: string;
  refreshedAt: string;
}

export interface ClickAgentActionLog {
  id: string;
  workspaceId: string;
  dealId: string;
  agentId: string;
  action: string;
  createdAt: string;
}

export interface ClickAgentApprovalRequest {
  id: string;
  workspaceId: string;
  dealId: string;
  agentId: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
}

export interface ClickKpi {
  id: string;
  workspaceId: string;
  name: string;
  value: number;
  trend: number;
}

export interface ClickMicroserviceContract {
  name: 'portal-proxy' | 'click-backend' | 'arva-gateway' | 'leads-bridge';
  transport: 'rest' | 'sse' | 'polling';
  requiresUserContext: boolean;
}

export interface ClickSecurityLayer {
  name: 'session' | 'workspace-isolation' | 'rls' | 'audit';
  enforcedBy: 'portal' | 'backend' | 'database';
  invariant: string;
}

export interface ClickLlmCascade {
  slots: ClickAgentSlot[];
  fallback: 'human_review' | 'retry_later';
  approvalRequiredFor: string[];
}

export interface LeadQualifiedPayload {
  lead_id: string;
  empresa_nome: string;
  contato_nome?: string;
  contato_email?: string;
  score: number;
  icp_origem?: string;
  historico_interacoes?: unknown[];
  dados_enriquecimento?: Record<string, unknown>;
  cadencia_completa?: boolean;
  total_respostas?: number;
}

