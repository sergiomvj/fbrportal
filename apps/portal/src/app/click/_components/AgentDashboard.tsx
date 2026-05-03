'use client';

import { useMemo, useState } from 'react';
import { AgentPicker } from '@fbr/ui';
import { arvaClickAgents } from '@/lib/click/fixtures';
import type { ClickAgent } from '@/lib/click/types';
import { clickAgentSlots } from '@/lib/click/types';

export function AgentDashboard({
  agents,
  isAdmin = false,
  onAgentPausedChange,
}: {
  agents: ClickAgent[];
  isAdmin?: boolean;
  onAgentPausedChange?: (agent: ClickAgent, paused: boolean) => void;
}) {
  const [linked, setLinked] = useState(arvaClickAgents.slice(0, 3));
  const [pausedByAgentId, setPausedByAgentId] = useState<Record<string, boolean>>({});
  const visibleAgents = useMemo(
    () => arvaClickAgents.filter((agent) => agent.tags.some((tag) => ['comercial', 'vendas'].includes(tag))),
    [],
  );

  function toggleAgent(agent: ClickAgent) {
    const paused = !(pausedByAgentId[agent.id] ?? agent.paused);
    setPausedByAgentId((current) => ({ ...current, [agent.id]: paused }));
    onAgentPausedChange?.(agent, paused);
  }

  return (
    <section className="click-agent-dashboard" aria-label="Dashboard de agentes Click">
      <header>
        <h2>Agentes Click</h2>
        <AgentPicker
          agents={visibleAgents}
          companyId="empresa-1"
          linkedAgents={linked}
          moduleId="click"
          moduleTags={['comercial', 'vendas']}
          onSelect={({ agent }) => setLinked((current) => (current.some((item) => item.id === agent.id) ? current : [...current, agent]))}
        />
      </header>
      <div className="click-agent-dashboard__grid">
        {clickAgentSlots.map((slot) => {
          const agent = agents.find((item) => item.slot === slot);
          const paused = agent ? (pausedByAgentId[agent.id] ?? agent.paused) : false;

          return (
            <article className="click-agent-slot" key={slot}>
              <span>{slot}</span>
              <h3>{agent?.name ?? 'Slot vazio'}</h3>
              <p>
                <i className={`click-heartbeat click-heartbeat--${agent?.status ?? 'offline'}`} /> {agent?.status ?? 'offline'}
              </p>
              <button disabled={!isAdmin || !agent} onClick={() => agent && toggleAgent(agent)} type="button">
                {paused ? 'Retomar' : 'Kill switch'}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
