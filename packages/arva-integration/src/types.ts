export type ArvaAgentStatus = 'active' | 'inactive';

export interface AgentPersona {
  role: string;
  tone?: string | undefined;
  description?: string | undefined;
}

export interface AgentRuntime {
  status: ArvaAgentStatus;
  heartbeatAt?: string | undefined;
  tags: string[];
}

export interface AgentPerformance {
  successRate?: number | undefined;
  avgResponseMs?: number | undefined;
  totalConversations?: number | undefined;
}

export interface ArvaAgent {
  id: string;
  fbrchatId?: string | undefined;
  avatarUrl?: string | undefined;
  name: string;
  role: string;
  tags: string[];
  status: ArvaAgentStatus;
  persona?: AgentPersona | undefined;
  runtime?: AgentRuntime | undefined;
  performance?: AgentPerformance | undefined;
}

export interface AgentIdentity {
  agentId: string;
  fbrchatId: string;
  displayName: string;
  persona: AgentPersona;
  runtime: AgentRuntime;
  performance?: AgentPerformance | undefined;
}

export interface OpenChatResult {
  chatId: string;
  url?: string | undefined;
  agentId: string;
  userId: string;
}

export interface ArvaClientConfig {
  baseUrl?: string;
  sharedToken?: string;
  fetcher?: typeof fetch;
}

export interface ArvaErrorBody {
  code: string;
  message: string;
  status?: number;
  cause?: unknown;
}
