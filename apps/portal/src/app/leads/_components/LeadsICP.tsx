'use client';

import Link from 'next/link';
import type { ICP } from '@/lib/leads/types';

const navItems = [
  { href: '/leads', label: 'Overview' },
  { href: '/leads/pipeline', label: 'Pipeline' },
  { href: '/leads/domains', label: 'Dominios' },
  { href: '/leads/icp', label: 'ICP' },
  { href: '/leads/agents', label: 'Agentes' },
  { href: '/leads/campaigns', label: 'Campanhas' },
  { href: '/leads/reports', label: 'Relatorios' },
];

export function LeadsICP({ icps }: { icps: ICP[] }) {
  return (
    <main className="leads-shell">
      <section className="leads-hero leads-hero--compact">
        <div>
          <p>FBR-Leads</p>
          <h1>Configuracao de ICP</h1>
          <span>Perfis de cliente ideal — setor, porte, cargo, regiao, keywords.</span>
        </div>
      </section>

      <nav className="leads-nav-tabs">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} data-active={item.href === '/leads/icp' ? 'true' : undefined}>
            {item.label}
          </Link>
        ))}
      </nav>

      <section className="leads-section" aria-label="ICPs">
        <header>
          <div>
            <p>ICP</p>
            <h2>{icps.filter((i) => i.ativo).length} ICPs Ativos</h2>
          </div>
        </header>

        <div className="leads-icp-grid">
          {icps.map((icp) => (
            <div key={icp.id} className="leads-icp-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>{icp.nome}</h3>
                <span className={`leads-badge ${icp.ativo ? 'leads-badge--online' : 'leads-badge--offline'}`}>
                  {icp.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>

              {icp.descricao && <p>{icp.descricao}</p>}

              {icp.setor.length > 0 && (
                <div className="leads-icp-tags">
                  {icp.setor.map((s) => <span key={s}>{s}</span>)}
                </div>
              )}

              {icp.cargo_alvo.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--leads-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Cargos Alvo</div>
                  <div className="leads-icp-tags">
                    {icp.cargo_alvo.map((c) => <span key={c} style={{ background: 'rgba(14, 165, 233, 0.12)', color: '#7dd3fc' }}>{c}</span>)}
                  </div>
                </div>
              )}

              {icp.regiao.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--leads-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Regioes</div>
                  <div className="leads-icp-tags">
                    {icp.regiao.map((r) => <span key={r} style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#c4b5fd' }}>{r}</span>)}
                  </div>
                </div>
              )}

              {icp.keywords.length > 0 && (
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--leads-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Keywords</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--leads-muted-light)', fontFamily: 'var(--fbr-font-code, monospace)' }}>
                    {icp.keywords.join(', ')}
                  </div>
                </div>
              )}

              <div className="leads-icp-stats">
                <span>Score min: <strong>{icp.score_minimo}</strong></span>
                <span>Leads: <strong>{icp.total_leads}</strong></span>
                <span>SQLs: <strong>{icp.total_sqls}</strong></span>
                <span>Conversao: <strong>{icp.taxa_conversao}%</strong></span>
              </div>

              {(icp.porte_funcionarios_min || icp.porte_funcionarios_max) && (
                <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--leads-muted)' }}>
                  Porte: {icp.porte_funcionarios_min ?? 0} - {icp.porte_funcionarios_max ?? '∞'} funcionarios
                </div>
              )}

              {icp.exclusoes.length > 0 && (
                <div style={{ marginTop: '6px', fontSize: '0.75rem', color: 'var(--leads-muted)' }}>
                  Exclusoes: {icp.exclusoes.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
