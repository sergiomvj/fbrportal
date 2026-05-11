'use client';

import Link from 'next/link';
import type { FonteRSS } from '@/lib/redacao/types';

const navItems = [
  { href: '/redacao', label: 'Dashboard' },
  { href: '/redacao/producao', label: 'Producao' },
  { href: '/redacao/publicados', label: 'Publicados' },
  { href: '/redacao/fontes', label: 'Fontes' },
  { href: '/redacao/ugc', label: 'UGC' },
  { href: '/redacao/alertas', label: 'Alertas' },
];

export function RedacaoFontes({ fontes }: { fontes: FonteRSS[] }) {
  return (
    <main className="redacao-shell">
      <section className="redacao-hero redacao-hero--compact">
        <div>
          <p>FBR-Redacao</p>
          <h1>Fontes RSS</h1>
          <span>Fontes de coleta configuradas</span>
        </div>
      </section>

      <nav className="redacao-nav-tabs">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} data-active={item.label === 'Fontes'}>{item.label}</Link>
        ))}
      </nav>

      <div className="redacao-fonte-grid">
        {fontes.map((fonte) => (
          <article key={fonte.id} className="redacao-fonte-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h3>{fonte.nome}</h3>
              <span className={`redacao-badge redacao-badge--${fonte.ativo ? 'online' : 'offline'}`}>
                {fonte.ativo ? 'Online' : 'Offline'}
              </span>
            </div>
            <p style={{ fontFamily: 'var(--fbr-font-code, monospace)', fontSize: '0.75rem', wordBreak: 'break-all', margin: '0 0 8px', color: 'var(--redacao-muted)' }}>
              {fonte.url}
            </p>
            <div className="redacao-card-meta">
              {fonte.cidade && <span>Cidade: <strong>{fonte.cidade}</strong></span>}
              {fonte.ultimo_ok && <span>Ultimo OK: <strong>{new Date(fonte.ultimo_ok).toLocaleDateString('pt-BR')}</strong></span>}
              <span>Intervalo: <strong>{fonte.intervalo_minutos} min</strong></span>
            </div>
          </article>
        ))}
      </div>

      {fontes.length === 0 && (
        <div className="redacao-empty">Nenhuma fonte RSS configurada.</div>
      )}
    </main>
  );
}
