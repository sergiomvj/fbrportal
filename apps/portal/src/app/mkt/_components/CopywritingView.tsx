'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { MktCopyVariant } from '@/lib/mkt/types';

export function CopywritingView() {
  const params = useParams();
  const id = params.id as string;
  const [copies, setCopies] = useState<MktCopyVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetch(`/api/proxy/mkt/estrategias/${id}/copy`)
      .then((r) => r.json())
      .then((d) => setCopies(d.copy ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const filtered = filter === 'all' ? copies : copies.filter((c) => c.tipo === filter);
  const grouped = new Map<string, MktCopyVariant[]>();
  for (const c of filtered) {
    const key = c.campanha_nome;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(c);
  }

  const copyTypes = [
    { value: 'all', label: 'Todos' },
    { value: 'headline', label: 'Headlines' },
    { value: 'cta', label: 'CTAs' },
    { value: 'body', label: 'Body Copy' },
    { value: 'landing_page', label: 'Landing Page' },
    { value: 'email', label: 'Emails' },
  ];

  const tipoColors: Record<string, string> = {
    headline: '#0EA5E9',
    cta: '#8B5CF6',
    body: '#F59E0B',
    landing_page: '#10B981',
    email: '#EC4899',
  };

  if (loading) return <main className="mkt-shell fbr-shared-theme"><p>Carregando copy...</p></main>;

  return (
    <main className="mkt-shell fbr-shared-theme">
      <nav className="mkt-breadcrumb">
        <Link href="/">Portal</Link><span>/</span>
        <Link href="/mkt">MKT</Link><span>/</span>
        <Link href={`/mkt/estrategias/${id}`}>Estrategia</Link><span>/</span>
        <span>Copy</span>
      </nav>

      <section className="mkt-hero">
        <div>
          <p>FBR-MKT</p>
          <h1>Copywriting</h1>
          <span>Headlines, CTAs, body copy e emails por campanha</span>
        </div>
      </section>

      <div className="mkt-copy-filters">
        {copyTypes.map((t) => (
          <button
            key={t.value}
            className={`mkt-tab ${filter === t.value ? 'mkt-tab--active' : ''}`}
            onClick={() => setFilter(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {grouped.size === 0 ? (
        <section className="mkt-section">
          <p>Nenhum copywriting gerado ainda.</p>
        </section>
      ) : (
        Array.from(grouped.entries()).map(([campanha, items]) => (
          <section key={campanha} className="mkt-section">
            <header><p>Campanha</p><h2>{campanha}</h2></header>
            <div className="mkt-copy-list">
              {items.map((item) => (
                <div key={item.id} className="mkt-copy-card" style={{ borderLeftColor: tipoColors[item.tipo] ?? '#666' }}>
                  <div className="mkt-copy-header">
                    <span className="mkt-badge" style={{ background: `${tipoColors[item.tipo]}22`, color: tipoColors[item.tipo] }}>{item.tipo}</span>
                    <span className="mkt-copy-canal">{item.canal}</span>
                  </div>
                  <p className="mkt-copy-content">{item.conteudo}</p>
                  {item.tom && <small>Tom: {item.tom}</small>}
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </main>
  );
}
