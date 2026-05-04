export interface FinanceKpi {
  id: string;
  label: string;
  value: string;
  detail: string;
}

export interface FinanceModule {
  id: string;
  icon: string;
  title: string;
  description: string;
  href: string;
}

export type FinanceAgentStatus = 'online' | 'offline' | 'scheduled';

export interface FinanceAgentSlot {
  id: string;
  name: string;
  role: string;
  cadence: string;
  status: FinanceAgentStatus;
}

export interface FinanceIntegration {
  id: string;
  source: string;
  flow: string;
  visibility: string;
}

export interface FinanceApprovalLimit {
  id: string;
  range: string;
  approver: string;
  note: string;
}

export interface FinanceGovernanceRole {
  id: string;
  role: string;
  responsibility: string;
}
