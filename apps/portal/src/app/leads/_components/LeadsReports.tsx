'use client';

import Link from 'next/link';
import type { Report } from '@/lib/leads/types';

const navItems = [
  { href: '/leads', label: 'Overview' },
  { href: '/leads/pipeline', label: 'Pipeline' },
  { href: '/leads/domains', label: 'Dominios' },
  { href: '/leads/icp', label: 'ICP' },
  { href: '/leads/agents', label: 'Agentes' },
  { href: '/leads/campaigns', label: 'Campanhas' },
  { href: '/leads/reports', label: 'Relatorios' },
];

export function LeadsReports({ reports }: { reports: Report[] }) {
  return (
    <main className="leads-shell">
      <section className="leads-hero leads-hero--compact">
        <div>
          <p>FBR-Leads</p>
          <h1>Relatorios</h1>
          <span>Relatorios automaticos gerados pelo Time 6 — Inteligencia.</span>
        </div>
      </section>

      <nav className="leads-nav-tabs">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} data-active={item.href === '/leads/reports' ? 'true' : undefined}>
            {item.label}
          </Link>
        ))}
      </nav>

      <section className="leads-section" aria-label="Relatorios">
        <header>
          <div>
            <p>Inteligencia</p>
            <h2>{reports.length} Relatorios</h2>
          </div>
        </header>

        {reports.length === 0 && (
          <div className="leads-empty">Nenhum relatorio encontrado.</div>
        )}

        <div className="leads-report-grid">
          {reports.map((report) => (
            <div key={report.id} className="leads-report-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>{report.periodo} — {report.tipo}</h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--leads-muted)' }}>
                  {report.created_at ? new Date(report.created_at).toLocaleDateString('pt-BR') : '-'}
                </span>
              </div>

              <div className="leads-report-kpis">
                <div>
                  <span>Captados</span>
                  <strong>{report.leads_captados}</strong>
                </div>
                <div>
                  <span>Qualificados</span>
                  <strong>{report.leads_qualificados}</strong>
                </div>
                <div>
                  <span>SQLs</span>
                  <strong>{report.sqls_entregues}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', fontSize: '0.78rem', color: 'var(--leads-muted)', fontFamily: 'var(--fbr-font-code, monospace)' }}>
                <span>Taxa resposta: <strong style={{ color: 'var(--leads-muted-light)' }}>{report.taxa_resposta}%</strong></span>
                <span>Bounce: <strong style={{ color: 'var(--leads-muted-light)' }}>{report.bounce_rate}%</strong></span>
                <span>Score medio: <strong style={{ color: 'var(--sky)' }}>{report.score_medio}</strong></span>
              </div>

              {report.icp_perfomance.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--leads-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Performance por ICP</div>
                  {report.icp_perfomance.map((icp) => (
                    <div key={icp.icp_id} className="leads-report-icp-row">
                      <span>{icp.icp_nome}</span>
                      <span>{icp.leads} leads / {icp.sqls} SQLs / {icp.taxa_conversao}%</span>
                    </div>
                  ))}
                </div>
              )}

              {report.sugestoes.length > 0 && (
                <div className="leads-report-sugestoes">
                  <h4>Sugestoes</h4>
                  <ul>
                    {report.sugestoes.map((sug, i) => (
                      <li key={i}>{sug}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
