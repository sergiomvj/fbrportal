'use client';

import Link from 'next/link';
import type { UGCSubmission } from '@/lib/redacao/types';

const navItems = [
  { href: '/redacao', label: 'Dashboard' },
  { href: '/redacao/producao', label: 'Producao' },
  { href: '/redacao/publicados', label: 'Publicados' },
  { href: '/redacao/fontes', label: 'Fontes' },
  { href: '/redacao/ugc', label: 'UGC' },
  { href: '/redacao/alertas', label: 'Alertas' },
];

const statusLabels: Record<string, string> = {
  pendente: 'Pendente',
  aceito: 'Aceito',
  rejeitado: 'Rejeitado',
};

function scoreClass(score: number) {
  if (score >= 60) return 'redacao-ugc-score--high';
  if (score >= 40) return 'redacao-ugc-score--medium';
  return 'redacao-ugc-score--low';
}

export function RedacaoUGC({ ugc }: { ugc: UGCSubmission[] }) {
  return (
    <main className="redacao-shell">
      <section className="redacao-hero redacao-hero--compact">
        <div>
          <p>FBR-Redacao</p>
          <h1>UGC</h1>
          <span>Conteudo gerado pelo usuario</span>
        </div>
      </section>

      <nav className="redacao-nav-tabs">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} data-active={item.label === 'UGC'}>{item.label}</Link>
        ))}
      </nav>

      <div className="redacao-grid">
        {ugc.map((item) => (
          <article key={item.id} className="redacao-ugc-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h3>{item.submissor ?? 'Anonimo'}</h3>
              <span className={`redacao-ugc-score ${scoreClass(item.score_confianca)}`}>
                {item.score_confianca}
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--redacao-muted)', marginBottom: 4 }}>{item.email ?? '-'}</p>
            {item.cidade && <p style={{ fontSize: '0.82rem', color: 'var(--redacao-muted)', marginBottom: 4 }}>{item.cidade}</p>}
            <p style={{ fontSize: '0.85rem', color: 'var(--redacao-muted-light)', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const }}>
              {item.descricao}
            </p>
            <div className="redacao-card-meta">
              <span className={`redacao-badge redacao-badge--${item.status}`}>{statusLabels[item.status]}</span>
              {item.auto_aprovavel && <span style={{ fontSize: '0.72rem', color: 'var(--green)' }}>Auto-aprovavel</span>}
            </div>
          </article>
        ))}
      </div>

      {ugc.length === 0 && (
        <div className="redacao-empty">Nenhuma submissao UGC encontrada.</div>
      )}
    </main>
  );
}
