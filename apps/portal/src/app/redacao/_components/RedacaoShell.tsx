'use client';

import Link from 'next/link';
import type { DashboardKpis } from '@/lib/redacao/types';

const navItems = [
  { href: '/redacao', label: 'Overview' },
  { href: '/redacao/producao', label: 'Em Producao' },
  { href: '/redacao/publicados', label: 'Publicados' },
  { href: '/redacao/fontes', label: 'Fontes RSS' },
  { href: '/redacao/ugc', label: 'Eu Reporter' },
  { href: '/redacao/alertas', label: 'Alertas' },
  { href: '/redacao/agentes', label: 'Agentes' },
];

const statusLabel: Record<string, string> = {
  online: 'Online',
  offline: 'Offline',
  processando: 'Processando',
  erro: 'Erro',
};

const nivelBadge: Record<string, string> = {
  info: 'redacao-badge--info',
  warn: 'redacao-badge--warn',
  error: 'redacao-badge--error',
};

export function RedacaoShell({ kpis }: { kpis: DashboardKpis }) {
  const maxEtapa = Math.max(1, ...kpis.artigos_por_etapa.map((e) => e.count));

  return (
    <main className="redacao-shell">
      <section className="redacao-hero">
        <span className="redacao-pulse" />
        <h1>FBR-Redacao</h1>
        <p className="redacao-hero-title">Newsroom Virtual</p>
        <p className="redacao-hero-sub">
          Coleta, producao editorial, revisao e publicacao automatizadas.
        </p>
      </section>

      <nav className="redacao-nav">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="redacao-nav-tab"
            data-active={item.href === '/redacao' ? '' : undefined}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <section className="redacao-kpis">
        <article className="redacao-kpi-card">
          <span>Total Artigos</span>
          <strong>{kpis.total_artigos}</strong>
        </article>
        <article className="redacao-kpi-card">
          <span>Publicados Hoje</span>
          <strong>{kpis.publicados_hoje}</strong>
        </article>
        <article className="redacao-kpi-card">
          <span>Em Producao</span>
          <strong>{kpis.em_producao}</strong>
        </article>
        <article className="redacao-kpi-card">
          <span>UGC Pendentes</span>
          <strong>{kpis.ugc_pendentes}</strong>
        </article>
        <article className="redacao-kpi-card">
          <span>Alertas Ativos</span>
          <strong>{kpis.alertas_ativos}</strong>
        </article>
        <article className="redacao-kpi-card">
          <span>Fontes Ativas</span>
          <strong>{kpis.fontes_ativas}</strong>
        </article>
      </section>

      {kpis.agentes.length > 0 && (
        <section className="redacao-section">
          <h2>Agentes</h2>
          <div className="redacao-agentes-grid">
            {kpis.agentes.map((agente) => (
              <article key={agente.id ?? agente.nome} className="redacao-agente-card">
                <header>
                  <span className={`redacao-agent-dot redacao-agent-dot--${agente.status}`} />
                  <h3>{agente.nome}</h3>
                  <span className={`redacao-badge redacao-badge--status redacao-badge--${agente.status}`}>
                    {statusLabel[agente.status] ?? agente.status}
                  </span>
                </header>
                <dl>
                  <dt>Fila Celery</dt>
                  <dd>{agente.fila_celery}</dd>
                  <dt>Tasks Ativas</dt>
                  <dd>{agente.tasks_ativas}</dd>
                  <dt>Processadas 24h</dt>
                  <dd>{agente.processadas_24h}</dd>
                  <dt>Fila</dt>
                  <dd>{agente.fila}</dd>
                </dl>
                {agente.descricao && <p>{agente.descricao}</p>}
              </article>
            ))}
          </div>
        </section>
      )}

      {kpis.artigos_por_etapa.length > 0 && (
        <section className="redacao-section">
          <h2>Pipeline</h2>
          <div className="redacao-pipeline">
            {kpis.artigos_por_etapa.map((etapa) => (
              <div key={etapa.etapa} className="redacao-pipeline-row">
                <span className="redacao-pipeline-label">{etapa.etapa}</span>
                <div className="redacao-pipeline-bar-track">
                  <div
                    className="redacao-pipeline-bar"
                    style={{ width: `${(etapa.count / maxEtapa) * 100}%` }}
                  />
                </div>
                <span className="redacao-pipeline-count">{etapa.count}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {kpis.artigos_por_cidade.length > 0 && (
        <section className="redacao-section">
          <h2>Artigos por Cidade</h2>
          <ul className="redacao-list">
            {kpis.artigos_por_cidade.map((item) => (
              <li key={item.cidade}>
                <span>{item.cidade}</span>
                <strong>{item.count}</strong>
              </li>
            ))}
          </ul>
        </section>
      )}

      {kpis.artigos_por_tipo.length > 0 && (
        <section className="redacao-section">
          <h2>Artigos por Tipo</h2>
          <ul className="redacao-list redacao-list--badges">
            {kpis.artigos_por_tipo.map((item) => (
              <li key={item.tipo}>
                <span className="redacao-badge redacao-badge--tipo">{item.tipo}</span>
                <strong>{item.count}</strong>
              </li>
            ))}
          </ul>
        </section>
      )}

      {kpis.alertas_por_nivel.length > 0 && (
        <section className="redacao-section">
          <h2>Alertas por Nivel</h2>
          <div className="redacao-alertas-nivel">
            {kpis.alertas_por_nivel.map((item) => (
              <span key={item.nivel} className={`redacao-badge ${nivelBadge[item.nivel] ?? ''}`}>
                {item.nivel}: {item.count}
              </span>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
