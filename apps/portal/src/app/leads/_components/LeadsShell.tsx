'use client';

import Link from 'next/link';
import type { DashboardKpis } from '@/lib/leads/types';

const etapaLabels: Record<string, string> = {
  captado: 'Captado',
  email_validado: 'E-mail Validado',
  icp_matching: 'Aderencia ICP',
  scoring: 'Scoring',
  redacao: 'Redacao',
  cadencia: 'Cadencia',
  sql_entregue: 'SQL Entregue',
  descartado: 'Descartado',
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

export function LeadsShell({ kpis }: { kpis: DashboardKpis }) {
  return (
    <main className="leads-shell">
      <section className="leads-hero">
        <div>
          <p><span className="leads-pulse" /> FBR-Leads</p>
          <h1>Inteligencia Comercial</h1>
          <span>Outbound, qualificacao e distribuicao de leads.</span>
        </div>
      </section>

      <nav className="leads-nav-tabs">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} data-active={item.href === '/leads' ? 'true' : undefined}>
            {item.label}
          </Link>
        ))}
      </nav>

      <section className="leads-kpis" aria-label="KPIs principais">
        <article><span>Leads Hoje</span><strong>{kpis.leads_captados_hoje}</strong></article>
        <article><span>Leads Semana</span><strong>{kpis.leads_semana}</strong></article>
        <article><span>Taxa Validacao</span><strong>{kpis.taxa_validacao}%</strong></article>
        <article><span>E-mails Hoje</span><strong>{kpis.emails_enviados_hoje}</strong></article>
        <article><span>Bounce Rate</span><strong>{kpis.bounce_rate}%</strong></article>
        <article><span>SQLs Entregues</span><strong>{kpis.sqls_entregues}</strong></article>
        <article><span>Score Medio</span><strong>{kpis.score_medio}</strong></article>
        <article><span>Total Leads</span><strong>{kpis.total_leads}</strong></article>
      </section>

      {kpis.saude_dominios.length > 0 && (
        <section className="leads-section" aria-label="Saude dos dominios">
          <header>
            <div>
              <p>Dominios</p>
              <h2>Saude dos Dominios</h2>
            </div>
            <Link href="/leads/domains" style={{ color: 'var(--sky)', fontSize: '0.82rem' }}>Ver detalhes</Link>
          </header>
          <div className="leads-domain-health-grid">
            {kpis.saude_dominios.map((d) => (
              <div key={d.dominio} className="leads-domain-health-item">
                <strong>{d.dominio}</strong>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className={`leads-badge leads-badge--${d.status}`}>{d.status}</span>
                  <span>{d.envios_hoje}/{d.limite_diario}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="leads-section" aria-label="Funnel de leads">
        <header>
          <div>
            <p>Pipeline</p>
            <h2>Funnel de Leads</h2>
          </div>
          <Link href="/leads/pipeline" style={{ color: 'var(--sky)', fontSize: '0.82rem' }}>Ver pipeline completo</Link>
        </header>
        <div className="leads-funnel">
          {kpis.leads_por_etapa.map((item, i) => (
            <div key={item.etapa} className="leads-funnel-stage">
              <span className="leads-funnel-stage-num">{String(i + 1).padStart(2, '0')}</span>
              <span className="leads-funnel-stage-name">{etapaLabels[item.etapa] ?? item.etapa}</span>
              <span className="leads-funnel-stage-desc">{item.count} leads nesta etapa</span>
              <span className="leads-funnel-stage-agent">{item.count}</span>
            </div>
          ))}
        </div>
      </section>

      {kpis.ultimos_sqls.length > 0 && (
        <section className="leads-section" aria-label="Ultimos SQLs">
          <header>
            <div>
              <p>SQLs</p>
              <h2>Ultimos SQLs Entregues</h2>
            </div>
          </header>
          <div className="leads-sql-list">
            {kpis.ultimos_sqls.map((sql) => (
              <div key={sql.lead_id} className="leads-sql-item">
                <div>
                  <strong>{sql.contato_nome}</strong>
                  <span style={{ marginLeft: '8px' }}>{sql.empresa_nome}</span>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span className={`leads-score leads-score--${sql.score >= 80 ? 'high' : sql.score >= 60 ? 'medium' : 'low'}`}>{sql.score}</span>
                  {sql.icp_nome && <span>{sql.icp_nome}</span>}
                  <span style={{ fontSize: '0.75rem' }}>{new Date(sql.entregue_em).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {kpis.leads_por_fonte.length > 0 && (
        <section className="leads-section" aria-label="Leads por fonte">
          <header>
            <div>
              <p>Fontes</p>
              <h2>Leads por Fonte</h2>
            </div>
          </header>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {kpis.leads_por_fonte.map((item) => (
              <div key={item.fonte} className="leads-domain-health-item" style={{ minWidth: '140px' }}>
                <strong style={{ fontSize: '0.82rem', color: 'var(--leads)' }}>{item.fonte}</strong>
                <span>{item.count}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
