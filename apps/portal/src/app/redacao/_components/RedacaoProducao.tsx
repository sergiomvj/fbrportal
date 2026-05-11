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

const etapaLabels: Record<string, string> = {
  coletado: 'Coletado',
  redigido: 'Redigido',
  com_midia: 'Com Midia',
  editado: 'Editado',
  erro: 'Erro',
  reprovado: 'Reprovado',
};

const tipoLabels: Record<string, string> = {
  noticia: 'Noticia',
  analise: 'Analise',
  traducao: 'Traducao',
};

const allEtapas = ['coletado', 'redigido', 'com_midia', 'editado', 'erro', 'reprovado'];
const allTipos = ['noticia', 'analise', 'traducao'];

export function RedacaoProducao({ initialArtigos }: { initialArtigos: Artigo[] }) {
  const [busca, setBusca] = useState('');
  const [selectedEtapas, setSelectedEtapas] = useState<string[]>([]);
  const [selectedTipos, setSelectedTipos] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return initialArtigos.filter((artigo) => {
      if (busca) {
        const q = busca.toLowerCase();
        if (!artigo.titulo.toLowerCase().includes(q) && !(artigo.fonte_nome?.toLowerCase().includes(q))) return false;
      }
      if (selectedEtapas.length > 0 && !selectedEtapas.includes(artigo.etapa)) return false;
      if (selectedTipos.length > 0 && !selectedTipos.includes(artigo.tipo)) return false;
      return true;
    });
  }, [busca, initialArtigos, selectedEtapas, selectedTipos]);

  const pageSize = 15;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  function toggleEtapa(etapa: string) {
    setPage(1);
    setSelectedEtapas((cur) => cur.includes(etapa) ? cur.filter((e) => e !== etapa) : [...cur, etapa]);
  }

  function toggleTipo(tipo: string) {
    setPage(1);
    setSelectedTipos((cur) => cur.includes(tipo) ? cur.filter((t) => t !== tipo) : [...cur, tipo]);
  }

  return (
    <main className="redacao-shell">
      <section className="redacao-hero redacao-hero--compact">
        <div>
          <p>FBR-Redacao</p>
          <h1>Producao</h1>
          <span>Artigos no pipeline editorial</span>
        </div>
      </section>

      <nav className="redacao-nav-tabs">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} data-active={item.label === 'Producao'}>{item.label}</Link>
        ))}
      </nav>

      <div className="redacao-filters">
        <input
          aria-label="Buscar artigo"
          onChange={(e) => { setBusca(e.target.value); setPage(1); }}
          placeholder="Buscar por titulo ou fonte..."
          value={busca}
        />
      </div>

      <div className="redacao-status-filter" style={{ marginBottom: 12 }}>
        {allEtapas.map((etapa) => (
          <button key={etapa} aria-pressed={selectedEtapas.includes(etapa)} onClick={() => toggleEtapa(etapa)} type="button">
            {etapaLabels[etapa]}
          </button>
        ))}
      </div>

      <div className="redacao-status-filter" style={{ marginBottom: 16 }}>
        {allTipos.map((tipo) => (
          <button key={tipo} aria-pressed={selectedTipos.includes(tipo)} onClick={() => toggleTipo(tipo)} type="button">
            {tipoLabels[tipo]}
          </button>
        ))}
      </div>

      <div className="redacao-table-wrap">
        <table className="redacao-table">
          <thead>
            <tr>
              <th scope="col">Titulo</th>
              <th scope="col">Cidade</th>
              <th scope="col">Tipo</th>
              <th scope="col">Etapa</th>
              <th scope="col">Agente</th>
              <th scope="col">Fonte</th>
              <th scope="col">Criado em</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.length === 0 && (
              <tr><td colSpan={7}>Nenhum artigo encontrado.</td></tr>
            )}
            {pageItems.map((artigo) => (
              <tr key={artigo.id}>
                <th scope="row">{artigo.titulo}</th>
                <td>{artigo.cidade ?? '-'}</td>
                <td><span className={`redacao-badge redacao-badge--${artigo.tipo}`}>{tipoLabels[artigo.tipo] ?? artigo.tipo}</span></td>
                <td><span className={`redacao-badge redacao-badge--${artigo.etapa}`}>{etapaLabels[artigo.etapa] ?? artigo.etapa}</span></td>
                <td>{artigo.agente_atual ?? '-'}</td>
                <td>{artigo.fonte_nome ?? '-'}</td>
                <td>{artigo.created_at ? new Date(artigo.created_at).toLocaleDateString('pt-BR') : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="redacao-pagination">
        <button disabled={page === 1} onClick={() => setPage((c) => c - 1)} type="button">Anterior</button>
        <span>Pagina {page} de {totalPages}</span>
        <button disabled={page === totalPages} onClick={() => setPage((c) => c + 1)} type="button">Proxima</button>
      </footer>
    </main>
  );
}
