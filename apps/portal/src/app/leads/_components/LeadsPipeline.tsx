'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { Lead } from '@/lib/leads/types';

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

const fonteLabels: Record<string, string> = {
  linkedin: 'LinkedIn',
  cnpj_biz: 'CNPJ.biz',
  google_maps: 'Google Maps',
  site: 'Site',
  manual: 'Manual',
};

const etapas = Object.keys(etapaLabels);
const fontes = Object.keys(fonteLabels);

const navItems = [
  { href: '/leads', label: 'Overview' },
  { href: '/leads/pipeline', label: 'Pipeline' },
  { href: '/leads/domains', label: 'Dominios' },
  { href: '/leads/icp', label: 'ICP' },
  { href: '/leads/agents', label: 'Agentes' },
  { href: '/leads/campaigns', label: 'Campanhas' },
  { href: '/leads/reports', label: 'Relatorios' },
];

export function LeadsPipeline({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads] = useState(initialLeads);
  const [busca, setBusca] = useState('');
  const [selectedEtapas, setSelectedEtapas] = useState<string[]>([]);
  const [selectedFontes, setSelectedFontes] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return leads.filter((lead) => {
      if (busca) {
        const q = busca.toLowerCase();
        if (!lead.contato_nome.toLowerCase().includes(q) && !lead.empresa_nome.toLowerCase().includes(q) && !(lead.contato_email?.toLowerCase().includes(q))) return false;
      }
      if (selectedEtapas.length > 0 && !selectedEtapas.includes(lead.etapa)) return false;
      if (selectedFontes.length > 0 && !selectedFontes.includes(lead.fonte)) return false;
      return true;
    });
  }, [busca, leads, selectedEtapas, selectedFontes]);

  const pageSize = 15;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  function toggleEtapas(etapa: string) {
    setPage(1);
    setSelectedEtapas((cur) => cur.includes(etapa) ? cur.filter((s) => s !== etapa) : [...cur, etapa]);
  }

  function toggleFontes(fonte: string) {
    setPage(1);
    setSelectedFontes((cur) => cur.includes(fonte) ? cur.filter((s) => s !== fonte) : [...cur, fonte]);
  }

  return (
    <main className="leads-shell">
      <section className="leads-hero leads-hero--compact">
        <div>
          <p>FBR-Leads</p>
          <h1>Pipeline de Leads</h1>
          <span>Visualize e filtre leads por etapa e fonte.</span>
        </div>
      </section>

      <nav className="leads-nav-tabs">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} data-active={item.href === '/leads/pipeline' ? 'true' : undefined}>
            {item.label}
          </Link>
        ))}
      </nav>

      <section className="leads-section" aria-label="Pipeline de leads">
        <header>
          <div>
            <p>Filtros</p>
            <h2>{filtered.length} leads encontrados</h2>
          </div>
        </header>

        <div className="leads-filters">
          <input
            aria-label="Buscar lead"
            onChange={(e) => { setBusca(e.target.value); setPage(1); }}
            placeholder="Buscar por nome, empresa ou e-mail..."
            value={busca}
          />
        </div>

        <div className="leads-status-filter" style={{ marginBottom: '12px' }}>
          {etapas.map((etapa) => (
            <button
              key={etapa}
              aria-pressed={selectedEtapas.includes(etapa)}
              onClick={() => toggleEtapas(etapa)}
              type="button"
            >
              {etapaLabels[etapa]}
            </button>
          ))}
        </div>

        <div className="leads-status-filter">
          {fontes.map((fonte) => (
            <button
              key={fonte}
              aria-pressed={selectedFontes.includes(fonte)}
              onClick={() => toggleFontes(fonte)}
              type="button"
            >
              {fonteLabels[fonte]}
            </button>
          ))}
        </div>

        <div className="leads-table-wrap" style={{ marginTop: '16px' }}>
          <table className="leads-table">
            <thead>
              <tr>
                <th scope="col">Contato</th>
                <th scope="col">Empresa</th>
                <th scope="col">Cargo</th>
                <th scope="col">Score</th>
                <th scope="col">Etapa</th>
                <th scope="col">Fonte</th>
                <th scope="col">E-mail</th>
                <th scope="col">ICP</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 && (
                <tr><td colSpan={8} className="leads-empty">Nenhum lead encontrado.</td></tr>
              )}
              {pageItems.map((lead) => (
                <tr key={lead.id}>
                  <td style={{ color: 'var(--fbr-white, #EEF4FF)', fontWeight: 600 }}>{lead.contato_nome}</td>
                  <td>{lead.empresa_nome}</td>
                  <td>{lead.contato_cargo ?? '-'}</td>
                  <td>
                    <span className={`leads-score leads-score--${lead.score >= 80 ? 'high' : lead.score >= 50 ? 'medium' : 'low'}`}>
                      {lead.score}
                    </span>
                  </td>
                  <td><span className={`leads-badge leads-badge--${lead.etapa}`}>{etapaLabels[lead.etapa]}</span></td>
                  <td>{fonteLabels[lead.fonte] ?? lead.fonte}</td>
                  <td style={{ fontSize: '0.78rem' }}>{lead.contato_email ?? '-'}</td>
                  <td style={{ fontSize: '0.78rem' }}>{lead.icp_id ? 'Sim' : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="leads-pagination">
          <button disabled={page === 1} onClick={() => setPage((c) => c - 1)} type="button">Anterior</button>
          <span>Pagina {page} de {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage((c) => c + 1)} type="button">Proxima</button>
        </footer>
      </section>
    </main>
  );
}
