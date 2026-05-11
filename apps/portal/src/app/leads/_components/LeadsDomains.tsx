'use client';

import Link from 'next/link';
import type { Domain } from '@/lib/leads/types';

const phaseLabels: Record<string, string> = {
  fase1: 'Fase 1 (Dias 1-30)',
  fase2: 'Fase 2 (Dias 31-60)',
  fase3: 'Fase 3 (Dias 61-90)',
  fase4: 'Fase 4 (Dia 90+)',
};

const phaseLimits: Record<string, string> = {
  fase1: 'Interno apenas',
  fase2: '10-20/dia',
  fase3: '30-50/dia',
  fase4: '50-100/dia',
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

export function LeadsDomains({ domains }: { domains: Domain[] }) {
  return (
    <main className="leads-shell">
      <section className="leads-hero leads-hero--compact">
        <div>
          <p>FBR-Leads</p>
          <h1>Saude dos Dominios</h1>
          <span>Monitoramento de reputacao, aquecimento e limites de envio.</span>
        </div>
      </section>

      <nav className="leads-nav-tabs">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} data-active={item.href === '/leads/domains' ? 'true' : undefined}>
            {item.label}
          </Link>
        ))}
      </nav>

      <section className="leads-section" aria-label="Dominios">
        <header>
          <div>
            <p>Mail Server</p>
            <h2>Protocolo de Aquecimento</h2>
          </div>
        </header>

        <div className="leads-table-wrap" style={{ marginBottom: '24px' }}>
          <table className="leads-table" style={{ minWidth: 'auto' }}>
            <thead>
              <tr>
                <th>Fase</th>
                <th>Periodo</th>
                <th>Volume/Dia</th>
                <th>Atividade</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style={{ color: 'var(--sky)' }}>Fase 1</td><td>Dias 1-30</td><td>Interno apenas</td><td>Trocas internas, sem envio externo</td></tr>
              <tr><td style={{ color: 'var(--sky)' }}>Fase 2</td><td>Dias 31-60</td><td>10-20 e-mails</td><td>Primeiros contatos externos (high-score)</td></tr>
              <tr><td style={{ color: 'var(--sky)' }}>Fase 3</td><td>Dias 61-90</td><td>30-50 e-mails</td><td>Volume controlado com cadencia 4 toques</td></tr>
              <tr><td style={{ color: 'var(--sky)' }}>Fase 4</td><td>Dia 90+</td><td>50-100 e-mails</td><td>Operacao plena com monitoramento continuo</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="leads-section" aria-label="Status dos dominios">
        <header>
          <div>
            <p>Dominios</p>
            <h2>{domains.length} Dominios Ativos</h2>
          </div>
        </header>

        <div className="leads-domain-grid">
          {domains.map((domain) => {
            const pct = domain.limite_diario > 0 ? Math.round((domain.envios_hoje / domain.limite_diario) * 100) : 0;
            const barColor = domain.status === 'saudavel' ? 'green' : domain.status === 'atencao' ? 'amber' : domain.status === 'critico' ? 'red' : 'blue';

            return (
              <div key={domain.id} className="leads-domain-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h3>{domain.dominio}</h3>
                  <span className={`leads-badge leads-badge--${domain.status}`}>{domain.status}</span>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--leads-muted)', fontFamily: 'var(--fbr-font-code, monospace)' }}>
                  {phaseLabels[domain.warming_phase]} &middot; Dia {domain.warming_dia} &middot; {phaseLimits[domain.warming_phase]}
                </div>

                <div className="leads-domain-stats">
                  <div>
                    <span>Bounce Rate</span>
                    <strong style={{ color: domain.bounce_rate > 2 ? 'var(--red)' : domain.bounce_rate > 1 ? 'var(--amber)' : 'var(--green)' }}>
                      {domain.bounce_rate}%
                    </strong>
                  </div>
                  <div>
                    <span>Open Rate</span>
                    <strong>{domain.open_rate}%</strong>
                  </div>
                  <div>
                    <span>Envios 7d</span>
                    <strong>{domain.total_envios_7d}</strong>
                  </div>
                </div>

                <div style={{ fontSize: '0.78rem', color: 'var(--leads-muted)', marginBottom: '4px' }}>
                  Envios hoje: {domain.envios_hoje}/{domain.limite_diario} ({pct}%)
                </div>
                <div className="leads-domain-bar">
                  <div className={`leads-domain-bar-fill leads-domain-bar-fill--${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>

                <div className="leads-domain-checks">
                  <span className={domain.spf_ok ? 'ok' : 'nok'}>SPF {domain.spf_ok ? 'OK' : 'NOK'}</span>
                  <span className={domain.dkim_ok ? 'ok' : 'nok'}>DKIM {domain.dkim_ok ? 'OK' : 'NOK'}</span>
                  <span className={domain.dmarc_ok ? 'ok' : 'nok'}>DMARC {domain.dmarc_ok ? 'OK' : 'NOK'}</span>
                  <span className={!domain.blacklist ? 'ok' : 'nok'}>{domain.blacklist ? 'BLACKLIST' : 'Clean'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
