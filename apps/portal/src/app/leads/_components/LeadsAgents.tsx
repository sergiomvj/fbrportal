'use client';

import Link from 'next/link';
import type { Agent, AgentLog } from '@/lib/leads/types';

const teamOrder = [1, 2, 3, 4, 5, 6];

const teamDescriptions: Record<number, string> = {
  1: 'Proteger e maximizar a reputacao de cada dominio. Fundacao de toda a operacao.',
  2: 'Captar dados brutos de multiplas fontes e transformar em registros estruturados.',
  3: 'Enriquecer, validar e qualificar leads. Pipeline rigido de 3 etapas obrigatorias.',
  4: 'Criar mensagens altamente personalizadas. Personalizacao e o que separa prospeccao de spam.',
  5: 'Controlar timing e sequencia de envio respeitando limites de cada dominio.',
  6: 'Retroalimentar os cinco times com aprendizados. Cerebro estrategico do sistema.',
};

const teamEmojis: Record<number, string> = {
  1: '🛡️',
  2: '⛏️',
  3: '🔍',
  4: '✍️',
  5: '📬',
  6: '🧠',
};

const typeLabels: Record<string, string> = {
  agent_start: 'start',
  agent_complete: 'done',
  agent_progress: 'progress',
  agent_failure: 'error',
  alerta_novo: 'alerta',
};

const navItems = [
  { href: '/leads', label: 'Overview' },
  { href: '/leads/pipeline', label: 'Pipeline' },
  { href: '/leads/domains', label: 'Dominios' },
  { href: '/leads/icp', label: 'ICP' },
  { href: '/leads/agents', label: 'Agentes' },
  { href: '/leads/campaigns', label: 'Campanhas' },
  { href: '/leads/reports', label: 'Relatorios' },
];

export function LeadsAgents({ agents, agentLogs }: { agents: Agent[]; agentLogs: AgentLog[] }) {
  const teams = teamOrder.map((num) => ({
    numero: num,
    nome: agents.find((a) => a.time_numero === num)?.time_nome ?? `Time ${num}`,
    emoji: teamEmojis[num],
    descricao: teamDescriptions[num],
    agents: agents.filter((a) => a.time_numero === num),
  }));

  return (
    <main className="leads-shell">
      <section className="leads-hero leads-hero--compact">
        <div>
          <p>FBR-Leads</p>
          <h1>Status dos Agentes</h1>
          <span>6 times de agentes OpenClaw — monitoramento em tempo real.</span>
        </div>
      </section>

      <nav className="leads-nav-tabs">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} data-active={item.href === '/leads/agents' ? 'true' : undefined}>
            {item.label}
          </Link>
        ))}
      </nav>

      <section className="leads-section" aria-label="Times de agentes">
        <header>
          <div>
            <p>OpenClaw</p>
            <h2>6 Times de Agentes</h2>
          </div>
        </header>

        <div className="leads-agent-grid">
          {teams.map((team) => (
            <div key={team.numero} className="leads-agent-team">
              <div className="team-label">Time {team.numero}</div>
              <h3>{team.emoji} {team.nome}</h3>
              <p className="team-mission">{team.descricao}</p>
              <ul className="leads-agent-list">
                {team.agents.map((agent) => (
                  <li key={agent.id}>
                    <span className="leads-agent-name">
                      <span className={`leads-agent-dot leads-agent-dot--${agent.status}`} />
                      {agent.nome}
                    </span>
                    <span className="leads-agent-meta">
                      <span>fila <strong>{agent.fila}</strong></span>
                      <span>24h <strong>{agent.processadas_24h}</strong></span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="leads-section" aria-label="Log de agentes">
        <header>
          <div>
            <p>Log</p>
            <h2>Atividade Recente</h2>
          </div>
        </header>

        <div className="leads-agent-log">
          {agentLogs.map((log) => (
            <div key={log.id} className="leads-agent-log-entry">
              <span className="leads-agent-log-time">
                {log.timestamp ? new Date(log.timestamp).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'}
              </span>
              <span className={`leads-agent-log-type leads-agent-log-type--${log.tipo}`}>
                {typeLabels[log.tipo] ?? log.tipo}
              </span>
              <span className="leads-agent-log-agent">{log.agent_nome}</span>
              <span className="leads-agent-log-msg">{log.mensagem}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
