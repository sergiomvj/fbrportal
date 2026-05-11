'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import type { ClickDeal, ClickKpi } from '@/lib/click/types';
import type { ClickStage } from '@/lib/click/types';
import { formatCurrency } from '../_components/format';

const stageLabels: Record<ClickStage, string> = {
  contato_inicial: 'Contato Inicial',
  descoberta: 'Descoberta',
  proposta: 'Proposta',
  negociacao: 'Negociacao',
  fechamento: 'Fechamento',
};

export function KpiShell({ kpis, deals }: { kpis: ClickKpi[]; deals: ClickDeal[] }) {
  const funnel = useMemo(() => {
    const counts: Record<ClickStage, number> = { contato_inicial: 0, descoberta: 0, proposta: 0, negociacao: 0, fechamento: 0 };
    let totalValue = 0;
    let totalScore = 0;
    for (const deal of deals) {
      counts[deal.stage]++;
      totalValue += deal.valueCents;
      totalScore += deal.score;
    }
    const maxCount = Math.max(...Object.values(counts), 1);
    return { counts, maxCount, totalValue, avgScore: Math.round(totalScore / (deals.length || 1)) };
  }, [deals]);

  const bySource = useMemo(() => {
    const sources: Record<string, number> = {};
    for (const deal of deals) sources[deal.source] = (sources[deal.source] || 0) + 1;
    return Object.entries(sources).sort((a, b) => b[1] - a[1]);
  }, [deals]);

  const byPriority = useMemo(() => {
    const priorities: Record<string, number> = {};
    for (const deal of deals) priorities[deal.priority] = (priorities[deal.priority] || 0) + 1;
    return Object.entries(priorities).sort((a, b) => b[1] - a[1]);
  }, [deals]);

  const topDeals = useMemo(
    () => [...deals].sort((a, b) => b.score - a.score).slice(0, 5),
    [deals],
  );

  return (
    <main className="click-shell fbr-shared-theme">
      <nav className="click-breadcrumb">
        <Link href="/">Portal</Link>
        <span>/</span>
        <Link href="/click">Click</Link>
        <span>/</span>
        <span>KPIs & Metricas</span>
      </nav>

      <section className="click-hero">
        <div className="click-hero__copy">
          <p>FBR-Click</p>
          <h1>KPIs & Metricas</h1>
          <span>Funil de conversao, receita prevista, score medio e performance de deals.</span>
        </div>
      </section>

      <section className="click-kpis" aria-label="KPIs Click">
        {kpis.map((kpi) => (
          <article key={kpi.id}>
            <span>{kpi.name}</span>
            <strong>{kpi.name.includes('Receita') ? formatCurrency(funnel.totalValue) : kpi.value}</strong>
            <small>{kpi.trend > 0 ? '+' : ''}{kpi.trend}%</small>
          </article>
        ))}
      </section>

      <section className="click-kpi-funnel" aria-label="Funil de conversao">
        <h2>Funil de Conversao</h2>
        <div className="click-kpi-funnel__bars">
          {(Object.entries(funnel.counts) as [ClickStage, number][]).map(([stage, count]) => (
            <div className="click-kpi-funnel__row" key={stage}>
              <span>{stageLabels[stage]}</span>
              <div className="click-kpi-funnel__track">
                <div
                  className="click-kpi-funnel__fill"
                  style={{ width: `${(count / funnel.maxCount) * 100}%` }}
                />
              </div>
              <strong>{count}</strong>
            </div>
          ))}
        </div>
      </section>

      <div className="click-kpi-grid">
        <section className="click-kpi-breakdown" aria-label="Por fonte">
          <h3>Por Fonte</h3>
          {bySource.map(([source, count]) => (
            <div className="click-kpi-breakdown__row" key={source}>
              <span>{source}</span>
              <strong>{count} deals</strong>
            </div>
          ))}
        </section>

        <section className="click-kpi-breakdown" aria-label="Por prioridade">
          <h3>Por Prioridade</h3>
          {byPriority.map(([priority, count]) => (
            <div className="click-kpi-breakdown__row" key={priority}>
              <span>{priority}</span>
              <strong>{count} deals</strong>
            </div>
          ))}
        </section>

        <section className="click-kpi-breakdown" aria-label="Top deals por score">
          <h3>Top Deals por Score</h3>
          {topDeals.map((deal) => (
            <div className="click-kpi-breakdown__row" key={deal.id}>
              <span>{deal.companyName}</span>
              <strong>Score {deal.score}</strong>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
