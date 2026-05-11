'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { MktAgent, MktAgentActionLog } from '@/lib/mkt/types';

const agentSlots = [
  { slot: 'extrator', icon: '📥', name: 'Extrator', queue: 'mkt:upload', description: 'Extrai SWOT, persona, UVP e score de viabilidade do documento' },
  { slot: 'estrategista', icon: '🧠', name: 'Estrategista', queue: 'mkt:estrategia', description: 'Gera posicionamento, canal mix, KPIs e campanhas priorizadas' },
  { slot: 'redator', icon: '✍️', name: 'Redator', queue: 'mkt:copy', description: 'Headlines, CTAs, body copy, landing pages e sequencias de email' },
  { slot: 'calendario', icon: '📅', name: 'Calendario', queue: 'mkt:calendario', description: 'Propoe 90 dias de pauta editorial com orgânico vs pago' },
  { slot: 'exportador', icon: '📦', name: 'Exportador', queue: 'mkt:export', description: 'Gera PDF executivo e PPTX com branding da empresa' },
  { slot: 'onboarding', icon: '🎓', name: 'Onboarding', queue: 'mkt:onboarding', description: 'Guia o usuario na primeira estrategia com prompts contextuais' },
];

export function AgentesShell() {
  const [agents, setAgents] = useState<MktAgent[]>([]);
  const [logs, setLogs] = useState<MktAgentActionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [queueStatus, setQueueStatus] = useState<Record<string, { pending: number; processing: number; done: number; failed: number }>>({});

  const headers = {
    'x-user-id': '33333333-3333-4333-8333-333333333333',
    'x-company-id': '11111111-1111-4111-8111-111111111111',
  };

  const fetchData = useCallback(async () => {
    try {
      const [agentsRes, logsRes, queueRes] = await Promise.all([
        fetch('/api/proxy/mkt/agents', { headers }),
        fetch('/api/proxy/mkt/agent-logs?limit=20', { headers }),
        fetch('/api/proxy/mkt/queue-status', { headers }),
      ]);

      if (agentsRes.ok) {
        const d = await agentsRes.json();
        setAgents(d.agents ?? []);
      }
      if (logsRes.ok) {
        const d = await logsRes.json();
        setLogs(d.logs ?? []);
      }
      if (queueRes.ok) {
        const d = await queueRes.json();
        setQueueStatus(d.queues ?? {});
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <main className="mkt-shell fbr-shared-theme"><p>Carregando agentes...</p></main>;

  return (
    <main className="mkt-shell fbr-shared-theme">
      <nav className="mkt-breadcrumb">
        <Link href="/">Portal</Link><span>/</span>
        <Link href="/mkt">MKT</Link><span>/</span>
        <span>Agentes</span>
      </nav>

      <section className="mkt-hero">
        <div>
          <p>FBR-MKT</p>
          <h1>Agentes OpenClaw</h1>
          <span>6 agentes especializados em marketing intelligence</span>
        </div>
      </section>

      <section className="mkt-agents" aria-label="Agentes MKT">
        <header>
          <p>Slots</p>
          <h2>6 Agentes Operacionais</h2>
        </header>
        <div className="mkt-agents__grid">
          {agentSlots.map((slot) => {
            const agent = agents.find((a) => a.slot === slot.slot);
            const queue = queueStatus[slot.queue];
            return (
              <article key={slot.slot} className={`mkt-agent-card ${agent?.ativo ? '' : 'mkt-agent-card--inactive'}`}>
                <h3>{slot.icon} {slot.name}</h3>
                <p>{slot.description}</p>
                <div className="mkt-agent-meta">
                  <span className="mkt-agent-queue">{slot.queue}</span>
                  {agent?.ativo !== false && <span className="mkt-badge mkt-badge--ativa">Ativo</span>}
                </div>
                {queue && (
                  <div className="mkt-agent-queue-stats">
                    <small>Pending: {queue.pending} | Processing: {queue.processing} | Done: {queue.done} | Failed: {queue.failed}</small>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="mkt-section">
        <header>
          <p>Filas</p>
          <h2>Status das Filas BullMQ</h2>
        </header>
        <div className="mkt-table-wrap">
          <table className="mkt-table">
            <thead>
              <tr>
                <th>Fila</th><th>Pending</th><th>Processing</th><th>Done</th><th>Failed</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(queueStatus).map(([name, status]) => (
                <tr key={name}>
                  <th>{name}</th>
                  <td>{status.pending}</td>
                  <td>{status.processing}</td>
                  <td>{status.done}</td>
                  <td className={status.failed > 0 ? 'mkt-alert-text' : ''}>{status.failed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mkt-section">
        <header>
          <p>Logs</p>
          <h2>Atividade Recente dos Agentes</h2>
        </header>
        {logs.length === 0 ? (
          <p>Nenhuma atividade registrada.</p>
        ) : (
          <div className="mkt-table-wrap">
            <table className="mkt-table">
              <thead>
                <tr>
                  <th>Slot</th><th>Acao</th><th>Entidade</th><th>Data</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td><span className="mkt-badge mkt-badge--planejada">{log.slot}</span></td>
                    <td>{log.acao}</td>
                    <td>{log.entidade_tipo}:{log.entidade_id?.slice(0, 8)}</td>
                    <td>{new Date(log.created_at ?? '').toLocaleString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
