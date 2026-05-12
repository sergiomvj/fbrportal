'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AgentPicker } from '@fbr/ui';
import type { ArvaAgent } from '@fbr/arva-integration';
import type { Agent, AgentLog } from '@/lib/leads/types';
import { requestJson } from './api';

const teamOrder = [1, 2, 3, 4, 5, 6];

const teamDescriptions: Record<number, string> = {
  1: 'Proteger e maximizar a reputacao de cada dominio. Fundacao de toda a operacao.',
  2: 'Captar dados brutos de multiplas fontes e transformar em registros estruturados.',
  3: 'Enriquecer, validar e qualificar leads sem quebrar a cadencia comercial.',
  4: 'Criar mensagens altamente personalizadas para evitar spam e aumentar resposta.',
  5: 'Controlar timing e sequencia de envio respeitando limites de cada dominio.',
  6: 'Retroalimentar os outros times com padroes, analises e ajustes de estrategia.',
};

const teamEmojis: Record<number, string> = {
  1: 'Shield',
  2: 'Source',
  3: 'Match',
  4: 'Copy',
  5: 'Send',
  6: 'Intel',
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

function nativeAgentsToArva(agents: Agent[]): ArvaAgent[] {
  return agents.slice(0, 6).map((agent) => ({
    id: `native-${agent.id}`,
    name: agent.nome,
    role: agent.role,
    tags: ['leads', 'openclaw', `time-${agent.time_numero}`],
    status: agent.status === 'offline' ? 'inactive' : 'active',
  }));
}

export function LeadsAgents({
  agentLogs,
  agents,
  companyId,
}: {
  agents: Agent[];
  agentLogs: AgentLog[];
  companyId: string;
}) {
  const [arvaAgents, setArvaAgents] = useState<ArvaAgent[]>([]);
  const [linkedAgents, setLinkedAgents] = useState<ArvaAgent[]>([]);
  const [loadingArva, setLoadingArva] = useState(true);
  const [arvaError, setArvaError] = useState<string | null>(null);

  const nativeFallback = useMemo(() => nativeAgentsToArva(agents), [agents]);

  useEffect(() => {
    async function loadArvaAgents() {
      try {
        setLoadingArva(true);
        const payload = await requestJson<{ agents: ArvaAgent[] }>(`/api/arva/agents?company_id=${companyId}`);
        setArvaAgents(payload.agents);
        setLinkedAgents(payload.agents.slice(0, 2));
      } catch (requestError) {
        setArvaError(requestError instanceof Error ? requestError.message : 'Nao foi possivel carregar agentes do Arva.');
        setArvaAgents(nativeFallback);
        setLinkedAgents(nativeFallback.slice(0, 2));
      } finally {
        setLoadingArva(false);
      }
    }

    loadArvaAgents();
  }, [companyId, nativeFallback]);

  const teams = teamOrder.map((num) => ({
    numero: num,
    nome: agents.find((agent) => agent.time_numero === num)?.time_nome ?? `Time ${num}`,
    emoji: teamEmojis[num],
    descricao: teamDescriptions[num],
    agents: agents.filter((agent) => agent.time_numero === num),
  }));

  return (
    <main className="leads-shell">
      <section className="leads-hero leads-hero--compact">
        <div>
          <p>FBR-Leads</p>
          <h1>Status dos Agentes</h1>
          <span>Operacao no FBRLeads, provisionamento e governanca centralizados no Arva Platform.</span>
        </div>
      </section>

      <nav className="leads-nav-tabs">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} data-active={item.href === '/leads/agents' ? 'true' : undefined}>
            {item.label}
          </Link>
        ))}
      </nav>

      <section className="leads-section" aria-label="Provisionamento Arva">
        <header className="leads-section-header-with-action">
          <div>
            <p>Arva Platform</p>
            <h2>Provisionamento e Gestao</h2>
          </div>
          <AgentPicker
            agents={arvaAgents}
            companyId={companyId}
            linkedAgents={linkedAgents}
            loading={loadingArva}
            moduleId="leads"
            moduleTags={['leads', 'openclaw', 'comercial']}
            onSelect={({ agent }) =>
              setLinkedAgents((current) => (current.some((item) => item.id === agent.id) ? current : [...current, agent]))
            }
            {...(arvaError ? { error: arvaError } : {})}
          />
        </header>

        <div className="leads-agent-strategy">
          <article className="leads-mini-card">
            <strong>Melhor arquitetura</strong>
            <span>Arva como source of truth</span>
            <small>Provisionar, pausar e governar agentes no Arva; operar filas, logs e desempenho no FBRLeads.</small>
          </article>
          <article className="leads-mini-card">
            <strong>Agentes nativos</strong>
            <span>Continuam validos</span>
            <small>Se ja existem no codigo, o ideal e mapealos para slots do Arva em vez de manter duas gestoes paralelas.</small>
          </article>
          <article className="leads-mini-card">
            <strong>OpenClaw</strong>
            <span>Camada de execucao</span>
            <small>O OpenClaw continua como runtime integrado ao servidor; Arva governa identidade, acesso e provisionamento.</small>
          </article>
        </div>
      </section>

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
              <div className="team-label">Time {team.numero} · {team.emoji}</div>
              <h3>{team.nome}</h3>
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
