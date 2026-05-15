'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AgentPicker } from '@fbr/ui';
import {
  arvaFinanceAgents,
  financeAgentSlots,
  financeApprovalLimits,
  financeGovernanceRoles,
  financeIntegrations,
  financeKpis,
  financeModules,
} from '@/lib/finance/fixtures';

const financeAgentTags = ['financeiro', 'contabilidade'];

export function FinanceShell() {
  const [linkedAgents, setLinkedAgents] = useState(arvaFinanceAgents.slice(0, 3));
  const visibleArvaAgents = useMemo(
    () => arvaFinanceAgents.filter((agent) => agent.tags.some((tag) => financeAgentTags.includes(tag))),
    [],
  );

  return (
    <main className="finance-shell fbr-shared-theme fbr-accent-finance">
      <section className="finance-hero">
        <div>
          <p>FBR-Finance</p>
          <h1>Operacao financeira governada por agentes</h1>
          <span>Modulo de entrada para KPIs, navegacao financeira e visibilidade de governanca.</span>
        </div>
      </section>

      <section aria-label="KPIs Finance" className="finance-kpis">
        {financeKpis.map((kpi) => (
          <article key={kpi.id}>
            <span>{kpi.label}</span>
            <strong>{kpi.value}</strong>
            <small>{kpi.detail}</small>
          </article>
        ))}
      </section>

      <section aria-label="Modulos Finance" className="finance-section">
        <header>
          <p>Modulos</p>
          <h2>Navegacao financeira</h2>
        </header>
        <div className="finance-module-grid">
          {financeModules.map((module) => (
            <Link className="finance-module-card" href={module.href} key={module.id}>
              <span aria-hidden="true">{module.icon}</span>
              <h3>{module.title}</h3>
              <p>{module.description}</p>
              <strong>Acessar modulo</strong>
            </Link>
          ))}
        </div>
      </section>

      <section aria-label="Slots de agentes Finance" className="finance-section">
        <header>
          <p>Vault team</p>
          <h2>Agentes financeiros</h2>
        </header>
        <div className="finance-agent-grid">
          {financeAgentSlots.map((agent) => (
            <article className="finance-agent-card" key={agent.id}>
              <span>{agent.name}</span>
              <h3>{agent.role}</h3>
              <p>{agent.cadence}</p>
              <small>
                <i className={`finance-heartbeat finance-heartbeat--${agent.status}`} /> {agent.status}
              </small>
            </article>
          ))}
        </div>
      </section>

      <section aria-label="Integracoes Finance" className="finance-section">
        <header>
          <p>Integracoes</p>
          <h2>Matriz operacional</h2>
        </header>
        <div className="finance-table-wrap">
          <table className="finance-table">
            <thead>
              <tr>
                <th scope="col">Sistema</th>
                <th scope="col">Fluxo</th>
                <th scope="col">Visibilidade</th>
              </tr>
            </thead>
            <tbody>
              {financeIntegrations.map((integration) => (
                <tr key={integration.id}>
                  <th scope="row">{integration.source}</th>
                  <td>{integration.flow}</td>
                  <td>{integration.visibility}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-label="Governanca Finance" className="finance-section finance-governance">
        <header>
          <p>Governanca</p>
          <h2>Limites e papeis</h2>
        </header>
        <div className="finance-governance-grid">
          <div>
            <h3>Approval limits</h3>
            {financeApprovalLimits.map((limit) => (
              <article className="finance-governance-row" key={limit.id}>
                <strong>{limit.range}</strong>
                <span>{limit.approver}</span>
                <p>{limit.note}</p>
              </article>
            ))}
          </div>
          <div>
            <h3>Roles</h3>
            {financeGovernanceRoles.map((role) => (
              <article className="finance-governance-row" key={role.id}>
                <strong>{role.role}</strong>
                <p>{role.responsibility}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
