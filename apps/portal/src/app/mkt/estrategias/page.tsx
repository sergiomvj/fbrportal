'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { MktEstrategia } from '@/lib/mkt/types';

export default function EstrategiasListPage() {
  const [estrategias, setEstrategias] = useState<MktEstrategia[]>([]);
  const [loading, setLoading] = useState(true);

  const headers = {
    'x-user-id': '33333333-3333-4333-8333-333333333333',
    'x-company-id': '11111111-1111-4111-8111-111111111111',
  };

  useEffect(() => {
    fetch('/api/proxy/mkt/estrategias?page_size=50', { headers })
      .then((r) => r.json())
      .then((d) => setEstrategias(d.estrategias ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <main className="mkt-shell fbr-shared-theme"><p>Carregando...</p></main>;

  return (
    <main className="mkt-shell fbr-shared-theme">
      <nav className="mkt-breadcrumb">
        <Link href="/">Portal</Link><span>/</span>
        <Link href="/mkt">MKT</Link><span>/</span>
        <span>Estrategias</span>
      </nav>

      <section className="mkt-hero">
        <div>
          <p>FBR-MKT</p>
          <h1>Estrategias</h1>
          <span>{estrategias.length} estrategias</span>
        </div>
        <Link href="/mkt/novo" className="mkt-cta-btn">Nova Estrategia</Link>
      </section>

      {estrategias.length === 0 ? (
        <section className="mkt-section">
          <p>Nenhuma estrategia criada ainda.</p>
          <Link href="/mkt/novo">Criar primeira estrategia</Link>
        </section>
      ) : (
        <section className="mkt-section">
          <div className="mkt-table-wrap">
            <table className="mkt-table">
              <thead>
                <tr>
                  <th>Nome</th><th>Status</th><th>Versao</th><th>Nicho</th><th>Criada em</th>
                </tr>
              </thead>
              <tbody>
                {estrategias.map((e) => (
                  <tr key={e.id}>
                    <th scope="row">
                      <Link href={`/mkt/estrategias/${e.id}`}>{e.nome}</Link>
                    </th>
                    <td><span className={`mkt-badge mkt-badge--${e.status}`}>{e.status}</span></td>
                    <td>v{e.versao}</td>
                    <td>{e.nicho ?? '-'}</td>
                    <td>{new Date(e.created_at ?? '').toLocaleDateString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
