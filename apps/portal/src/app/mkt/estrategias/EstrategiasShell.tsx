'use client';

import Link from 'next/link';

const estrategias = [
  { id: 'est-1', nome: 'Lancamento Produto X', nicho: 'SaaS B2B', status: 'ativa', versao: 3, criadaEm: '2026-04-12' },
  { id: 'est-2', nome: 'Rebranding Corporativo', nicho: 'Consultoria', status: 'revisao', versao: 1, criadaEm: '2026-05-01' },
  { id: 'est-3', nome: 'Expansao Regional Sul', nicho: 'Varejo', status: 'processando', versao: 1, criadaEm: '2026-05-07' },
  { id: 'est-4', nome: 'Campanha Fim de Ano', nicho: 'E-commerce', status: 'arquivada', versao: 2, criadaEm: '2025-11-20' },
  { id: 'est-5', nome: 'Lead Gen Webinar Series', nicho: 'Educacao', status: 'ativa', versao: 2, criadaEm: '2026-03-15' },
];

const statusLabels: Record<string, { label: string; className: string }> = {
  ativa: { label: 'Ativa', className: 'mkt-badge--ativa' },
  revisao: { label: 'Revisao', className: 'mkt-badge--pausada' },
  processando: { label: 'Processando', className: 'mkt-badge--planejada' },
  arquivada: { label: 'Arquivada', className: 'mkt-badge--finalizada' },
};

export function EstrategiasShell() {
  return (
    <main className="mkt-shell fbr-shared-theme">
      <nav className="mkt-breadcrumb">
        <Link href="/">Portal</Link>
        <span>/</span>
        <Link href="/mkt">MKT</Link>
        <span>/</span>
        <span>Estrategias</span>
      </nav>

      <section className="mkt-hero">
        <div>
          <p>FBR-MKT</p>
          <h1>Estrategias de Marketing</h1>
          <span>Crie, revise e gerencie estrategias completas geradas por IA.</span>
        </div>
      </section>

      <section className="mkt-section">
        <header>
          <p>Biblioteca</p>
          <h2>Todas as estrategias</h2>
        </header>
        <div className="mkt-table-wrap">
          <table className="mkt-table">
            <thead>
              <tr>
                <th scope="col">Nome</th>
                <th scope="col">Nicho</th>
                <th scope="col">Status</th>
                <th scope="col">Versao</th>
                <th scope="col">Criada em</th>
              </tr>
            </thead>
            <tbody>
              {estrategias.map((est) => (
                <tr key={est.id}>
                  <th scope="row">{est.nome}</th>
                  <td>{est.nicho}</td>
                  <td>
                    <span className={`mkt-badge ${statusLabels[est.status]?.className ?? ''}`}>
                      {statusLabels[est.status]?.label ?? est.status}
                    </span>
                  </td>
                  <td>v{est.versao}</td>
                  <td>{est.criadaEm}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mkt-section">
        <header>
          <p>Workflow</p>
          <h2>Fluxo de geracao</h2>
        </header>
        <div className="mkt-status-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
          {[
            { step: '1', name: 'Upload', desc: 'PDF/DOCX' },
            { step: '2', name: 'Extracao', desc: 'SWOT + Persona' },
            { step: '3', name: 'Diagnostico', desc: 'Score + Aprovacao' },
            { step: '4', name: 'Geracao', desc: 'Estrategia + Copy' },
            { step: '5', name: 'Exportacao', desc: 'PDF + PPTX' },
          ].map((item) => (
            <article className="mkt-status-card" key={item.step}>
              <strong style={{ color: 'var(--mkt-sky)' }}>{item.step}</strong>
              <span>{item.name}</span>
              <small style={{ color: 'var(--mkt-slate)' }}>{item.desc}</small>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
