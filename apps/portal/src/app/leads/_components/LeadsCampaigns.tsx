'use client';

import Link from 'next/link';
import type { Campaign } from '@/lib/leads/types';

const statusLabels: Record<string, string> = {
  rascunho: 'Rascunho',
  ativa: 'Ativa',
  pausada: 'Pausada',
  concluida: 'Concluida',
};

const navItems = [
  { href: '/leads', label: 'Overview' },
  { href: '/leads/pipeline', label: 'Pipeline' },
  { href: '/leads/domains', label: 'Dominios' },
  { href: '/leads/icp', label: 'ICP' },
  { href: '/leads/agents', label: 'Agentes' },
  { href: '/leads/campaigns', label: 'Campanhas' },
  { href: '/leads/reports', label: 'Relatorios' },
];

export function LeadsCampaigns({ campaigns }: { campaigns: Campaign[] }) {
  return (
    <main className="leads-shell">
      <section className="leads-hero leads-hero--compact">
        <div>
          <p>FBR-Leads</p>
          <h1>Campanhas</h1>
          <span>Criacao, monitoramento e metricas de campanhas outbound.</span>
        </div>
      </section>

      <nav className="leads-nav-tabs">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} data-active={item.href === '/leads/campaigns' ? 'true' : undefined}>
            {item.label}
          </Link>
        ))}
      </nav>

      <section className="leads-section" aria-label="Campanhas">
        <header>
          <div>
            <p>Outbound</p>
            <h2>{campaigns.length} Campanhas</h2>
          </div>
        </header>

        {campaigns.length === 0 && (
          <div className="leads-empty">Nenhuma campanha encontrada.</div>
        )}

        <div className="leads-campaign-grid">
          {campaigns.map((camp) => (
            <div key={camp.id} className="leads-campaign-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>{camp.nome}</h3>
                <span className={`leads-badge leads-badge--${camp.status}`}>{statusLabels[camp.status]}</span>
              </div>

              {camp.descricao && <p className="campaign-desc">{camp.descricao}</p>}

              <div className="leads-campaign-metrics">
                <div>
                  <span>Leads</span>
                  <strong>{camp.total_leads}</strong>
                </div>
                <div>
                  <span>Qualificados</span>
                  <strong>{camp.leads_qualificados}</strong>
                </div>
                <div>
                  <span>Abertura</span>
                  <strong>{camp.taxa_abertura}%</strong>
                </div>
                <div>
                  <span>Resposta</span>
                  <strong>{camp.taxa_resposta}%</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', fontSize: '0.78rem', color: 'var(--leads-muted)', fontFamily: 'var(--fbr-font-code, monospace)' }}>
                <span>Clique: <strong style={{ color: 'var(--leads-muted-light)' }}>{camp.taxa_clique}%</strong></span>
                <span>Bounce: <strong style={{ color: camp.bounce_rate > 2 ? 'var(--red)' : 'var(--leads-muted-light)' }}>{camp.bounce_rate}%</strong></span>
              </div>

              {camp.cadencia_config.length > 0 && (
                <div className="leads-cadencia-timeline">
                  {camp.cadencia_config.map((step) => (
                    <div key={step.toque} className="leads-cadencia-step">
                      <strong>Toque {step.toque}</strong>
                      <span>Dia {step.dia}</span>
                      <span>{step.horario_inicio}-{step.horario_fim}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: '10px', fontSize: '0.72rem', color: 'var(--leads-muted)' }}>
                Criada em: {camp.created_at ? new Date(camp.created_at).toLocaleDateString('pt-BR') : '-'}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
