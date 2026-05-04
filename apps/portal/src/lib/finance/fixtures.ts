import type { ArvaAgent } from '@fbr/arva-integration';
import type {
  FinanceAgentSlot,
  FinanceApprovalLimit,
  FinanceGovernanceRole,
  FinanceIntegration,
  FinanceKpi,
  FinanceModule,
} from './types';

export const financeKpis: FinanceKpi[] = [
  { id: 'integrated', label: 'Integracoes', value: '100% integrados', detail: 'Sales, Click, Dev, Suporte, Leads e bancos' },
  { id: 'companies', label: 'Empresas', value: 'N empresas', detail: 'Carteira operacional consolidada' },
  { id: 'traceability', label: 'Rastreabilidade', value: '0 transacoes sem rastreio', detail: 'Eventos financeiros com origem identificada' },
  { id: 'sla', label: 'SLA financeiro', value: '24h SLA', detail: 'Fila de aprovacao e resposta operacional' },
];

export const financeModules: FinanceModule[] = [
  {
    id: 'recebimentos',
    icon: 'RC',
    title: 'Recebimentos',
    description: 'Contas a receber, parceiros, faturas pendentes e baixa operacional.',
    href: '/finance/recebimentos',
  },
  {
    id: 'pagamentos',
    icon: 'PG',
    title: 'Pagamentos',
    description: 'Fornecedores, vencimentos e preparacao de ordens com aprovacao humana.',
    href: '/finance/pagamentos',
  },
  {
    id: 'centro-custo',
    icon: 'CC',
    title: 'Centro de Custo',
    description: 'Orcamentos por empresa, hierarquia e acompanhamento de consumo.',
    href: '/finance/centro-custo',
  },
  {
    id: 'conciliacao',
    icon: 'CN',
    title: 'Conciliacao',
    description: 'Conferencia bancaria, pendencias, divergencias e trilha de aprovacao.',
    href: '/finance/conciliacao',
  },
  {
    id: 'forecasting',
    icon: 'FC',
    title: 'Forecasting',
    description: 'Projecoes de caixa, cenarios 30/60/90 dias e relatorios mensais.',
    href: '/finance/forecasting',
  },
  {
    id: 'auditoria',
    icon: 'AU',
    title: 'Auditoria',
    description: 'Logs imutaveis, revisao mensal, exportacao e compliance financeiro.',
    href: '/finance/auditoria',
  },
];

export const financeAgentSlots: FinanceAgentSlot[] = [
  { id: 'vault', name: 'Vault', role: 'CFO Digital e orquestrador', cadence: 'coordena o time financeiro', status: 'online' },
  { id: 'intake', name: 'Intake', role: 'Recebimentos', cadence: 'captura e classifica entradas', status: 'online' },
  { id: 'payout', name: 'Payout', role: 'Pagamentos', cadence: 'prepara ordens para aprovacao humana', status: 'scheduled' },
  { id: 'ledger', name: 'Ledger', role: 'Centro de custo', cadence: 'mantem classificacao por empresa', status: 'online' },
  { id: 'reconcile', name: 'Reconcile', role: 'Conciliacao', cadence: 'rotina diaria 23h', status: 'scheduled' },
  { id: 'oracle', name: 'Oracle', role: 'Forecasting', cadence: 'relatorio mensal', status: 'offline' },
  { id: 'sentinel', name: 'Sentinel', role: 'Auditoria', cadence: 'monitoramento continuo', status: 'online' },
];

export const arvaFinanceAgents: ArvaAgent[] = [
  { id: 'arva-vault', name: 'Vault', role: 'CFO Digital', tags: ['financeiro', 'contabilidade'], status: 'active' },
  { id: 'arva-intake', name: 'Intake', role: 'Recebimentos', tags: ['financeiro'], status: 'active' },
  { id: 'arva-payout', name: 'Payout', role: 'Pagamentos', tags: ['financeiro', 'contabilidade'], status: 'inactive' },
  { id: 'arva-ledger', name: 'Ledger', role: 'Centro de custo', tags: ['contabilidade'], status: 'active' },
  { id: 'arva-reconcile', name: 'Reconcile', role: 'Conciliacao bancaria', tags: ['financeiro'], status: 'active' },
  { id: 'arva-oracle', name: 'Oracle', role: 'Forecasting', tags: ['financeiro'], status: 'inactive' },
  { id: 'arva-sentinel', name: 'Sentinel', role: 'Auditoria continua', tags: ['contabilidade'], status: 'active' },
  { id: 'arva-support', name: 'Suporte IA', role: 'Atendimento tecnico', tags: ['suporte'], status: 'active' },
];

export const financeIntegrations: FinanceIntegration[] = [
  { id: 'sales', source: 'FBR-Sales', flow: 'Receita, propostas e previsao comercial', visibility: 'entrada consolidada' },
  { id: 'click', source: 'Click', flow: 'Alertas, aprovacoes e comunicacao com gestores', visibility: 'canal financeiro' },
  { id: 'dev', source: 'Dev', flow: 'Demandas internas e custos de desenvolvimento', visibility: 'centro de custo' },
  { id: 'suporte', source: 'Suporte', flow: 'Contratos, SLA e impacto operacional', visibility: 'auditoria de atendimento' },
  { id: 'leads', source: 'Leads', flow: 'Origem de receita e forecast comercial', visibility: 'pipeline futuro' },
  { id: 'players', source: 'Players Externos', flow: 'Parceiros, repasses e faturamento externo', visibility: 'recebimentos' },
  { id: 'banks', source: 'Bancos/Fintechs', flow: 'Extratos, contas e conciliacao bancaria', visibility: 'rastreio transacional' },
];

export const financeApprovalLimits: FinanceApprovalLimit[] = [
  { id: 'manager', range: '<= R$500', approver: 'Gestor', note: 'aprovacao operacional de baixo valor' },
  { id: 'director', range: 'R$500-5k', approver: 'Diretor', note: 'aprovacao por limite de valor' },
  { id: 'c-level', range: '> R$5k', approver: 'C-level', note: 'pagamentos altos exigem aprovacao executiva' },
];

export const financeGovernanceRoles: FinanceGovernanceRole[] = [
  { id: 'cfo', role: 'CFO', responsibility: 'Aprovacao de pagamentos altos, fechamento de periodo e acesso total.' },
  { id: 'gestor', role: 'Gestor', responsibility: 'Aprovacao de pagamentos medios, fornecedores e conciliacao.' },
  { id: 'analista', role: 'Analista', responsibility: 'Lancamentos, revisao de conciliacao e geracao de relatorios.' },
  { id: 'auditor', role: 'Auditor', responsibility: 'Acesso read-only completo e revisao mensal do audit log.' },
  { id: 'owner', role: 'Owner', responsibility: 'Kill switch dos agentes, novos agentes e configuracao de limites.' },
];
