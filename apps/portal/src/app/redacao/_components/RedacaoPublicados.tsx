'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { Artigo } from '@/lib/redacao/types';

const navItems = [
  { href: '/redacao', label: 'Dashboard' },
  { href: '/redacao/producao', label: 'Producao' },
  { href: '/redacao/publicados', label: 'Publicados' },
  { href: '/redacao/fontes', label: 'Fontes' },
  { href: '/redacao/ugc', label: 'UGC' },
  { href: '/redacao/alertas', label: 'Alertas' },
];

const tipoLabels: Record<string, string> = {
  noticia: 'Noticia',
  analise: 'Analise',
  traducao: 'Traducao',
};

export function RedacaoPublicados({ artigos }: { artigos: Artigo[] }) {
  const [busca, setBusca] = useState('');
  const [selectedCidade, setSelectedCidade] = useState('');
  const [selectedTipo, setSelectedTipo] = useState('');

  const cidades = useMemo(() => {
    const set = new Set(artigos.map((a) => a.cidade).filter(Boolean));
    return Array.from(set).sort();
  }, [artigos]);

  const filtered = useMemo(() => {
    return artigos.filter((artigo) => {
      if (busca) {
        const q = busca.toLowerCase();
        if (!artigo.titulo.toLowerCase().includes(q) && !(artigo.fonte_nome?.toLowerCase().includes(q))) return false;
      }
      if (selectedCidade && artigo.cidade !== selectedCidade) return false;
      if (selectedTipo && artigo.tipo !== selectedTipo) return false;
      return true;
    });
  }, [busca, artigos, selectedCidade, selectedTipo]);

  return (
    <main className="redacao-shell">
      <section className="redacao-hero redacao-hero--compact">
        <div>
          <p>FBR-Redacao</p>
          <h1>Publicados</h1>
          <span>Artigos ja publicados</span>
        </div>
      </section>

      <nav className="redacao-nav-tabs">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} data-active={item.label === 'Publicados'}>{item.label}</Link>
        ))}
      </nav>

      <div className="redacao-filters">
        <input
          aria-label="Buscar artigo publicado"
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por titulo ou fonte..."
          value={busca}
        />
      </div>

      <div className="redacao-status-filter" style={{ marginBottom: 16 }}>
        <button aria-pressed={!selectedCidade} onClick={() => setSelectedCidade('')} type="button">Todas cidades</button>
        {cidades.map((cidade) => (
          <button key={cidade} aria-pressed={selectedCidade === cidade} onClick={() => setSelectedCidade(selectedCidade === cidade ? '' : cidade)} type="button">
            {cidade}
          </button>
        ))}
      </div>

      <div className="redacao-status-filter" style={{ marginBottom: 24 }}>
        <button aria-pressed={!selectedTipo} onClick={() => setSelectedTipo('')} type="button">Todos tipos</button>
        {Object.entries(tipoLabels).map(([key, label]) => (
          <button key={key} aria-pressed={selectedTipo === key} onClick={() => setSelectedTipo(selectedTipo === key ? '' : key)} type="button">
            {label}
          </button>
        ))}
      </div>

      <p style={{ marginBottom: 16, color: 'var(--redacao-muted)', fontSize: '0.9rem' }}>
        {filtered.length} artigos publicados
      </p>

      <div className="redacao-grid">
        {filtered.map((artigo) => (
          <article key={artigo.id} className="redacao-card">
            <h3>{artigo.titulo}</h3>
            <p>{artigo.cidade ?? '-'}</p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <span className={`redacao-badge redacao-badge--${artigo.tipo}`}>{tipoLabels[artigo.tipo] ?? artigo.tipo}</span>
              {artigo.url_publicado && (
                <a href={artigo.url_publicado} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: 'var(--redacao)' }}>
                  Abrir artigo
                </a>
              )}
            </div>
            <div className="redacao-card-meta">
              {artigo.publicado_em && <span>Publicado em <strong>{new Date(artigo.publicado_em).toLocaleDateString('pt-BR')}</strong></span>}
              {artigo.fonte_nome && <span>Fonte: <strong>{artigo.fonte_nome}</strong></span>}
            </div>
          </article>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="redacao-empty">Nenhum artigo publicado encontrado.</div>
      )}
    </main>
  );
}
