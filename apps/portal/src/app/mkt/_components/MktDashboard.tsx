'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { MktDashboardKpis, Campaign } from '@/lib/mkt/types';

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatNumber(value: number) {
  return value.toLocaleString('pt-BR');
}

const mktAgents = [
  { name: 'Extrator Bot', role: 'Extrai SWOT, persona, UVP do documento', trigger: 'Upload PDF/DOCX' },
  { name: 'Estrategista Bot', role: 'Gera posicionamento, canal mix, KPIs', trigger: 'Diagnostico aprovado' },
  { name: 'Redator Bot', role: 'Headlines, CTAs, copy, landing pages', trigger: 'Estrategia gerada' },
  { name: 'Calendario Bot', role: 'Propoe grade editorial 90 dias', trigger: 'Redacao pronta' },
  { name: 'Exportador Bot', role: 'Gera PDF executivo e PPTX', trigger: 'Aprovacao do cliente' },
  { name: 'Onboarding Bot', role: 'Guia o usuario na primeira estrategia', trigger: 'Primeiro acesso' },
];

interface DashboardData {
  kpis: MktDashboardKpis;
  campanhas: Campaign[];
}

export function MktDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const headers = {
        'x-user-id': '33333333-3333-4333-8333-333333333333',
        'x-company-id': '11111111-1111-4111-8111-111111111111',
      };

      const [dashRes, campRes] = await Promise.all([
        fetch('/api/proxy/mkt/dashboard', { headers }),
        fetch('/api/proxy/mkt/campaigns?page_size=50', { headers }),
      ]);

      if (!dashRes.ok || !campRes.ok) throw new Error('Erro ao carregar dados');

      const [dashJson, campJson] = await Promise.all([dashRes.json(), campRes.json()]);

      setData({ kpis: dashJson.kpis, campanhas: campJson.campanhas });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <main className="mkt-shell fbr-shared-theme">
        <p>Carregando...</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="mkt-shell fbr-shared-theme">
        <p>Erro: {error ?? 'Dados nao disponiveis'}</p>
      </main>
    );
  }

  const { kpis, campanhas } = data;

  return (
    <main className="mkt-shell fbr-shared-theme">
      <nav className="mkt-breadcrumb">
        <Link href="/">Portal</Link>
        <span>/</span>
        <span>MKT</span>
      </nav>

      <section className="mkt-hero">
        <div>
          <p>FBR-MKT</p>
          <h1>Marketing Intelligence Platform</h1>
          <span>De um relatorio de viabilidade a uma estrategia completa em menos de 60 segundos.</span>
          <div className="mkt-hero__chips">
            <span>6 Agentes OpenClaw</span>
            <span>BullMQ Workers</span>
            <span>SSE Progresso</span>
            <span>Calendario 90 dias</span>
          </div>
        </div>
      </section>

      <section aria-label="KPIs Marketing" className="mkt-kpis">
        <article>
          <span>Campanhas Ativas</span>
          <strong>{kpis.campanhas_ativas}</strong>
          <small>de {kpis.campanhas_por_status.reduce((s, c) => s + c.value, 0)} total</small>
        </article>
        <article>
          <span>ROI Medio</span>
          <strong>{kpis.roi_medio}x</strong>
          <small>retorno sobre investimento</small>
        </article>
        <article>
          <span>Budget Total</span>
          <strong>{formatBRL(kpis.budget_total)}</strong>
          <small>{formatBRL(kpis.budget_gasto)} gastos</small>
        </article>
        <article>
          <span>CAC Medio</span>
          <strong>{formatBRL(kpis.cac_medio)}</strong>
          <small>custo por aquisicao</small>
        </article>
        <article>
          <span>LTV Medio</span>
          <strong>{formatBRL(kpis.ltv_medio)}</strong>
          <small>lifetime value</small>
        </article>
        <article>
          <span>Total Leads</span>
          <strong>{formatNumber(kpis.total_leads)}</strong>
          <small>conversoes acumuladas</small>
        </article>
        <article>
          <span>Impressoes</span>
          <strong>{formatNumber(kpis.impressoes_total)}</strong>
          <small>{kpis.ctr_medio}% CTR</small>
        </article>
        <article>
          <span>Cliques</span>
          <strong>{formatNumber(kpis.cliques_total)}</strong>
          <small>{formatNumber(kpis.conversoes_total)} conversoes</small>
        </article>
      </section>

      <div className="mkt-nav-links">
        <Link href="/mkt/estrategias">Estrategias</Link>
        <Link href="/mkt/calendario">Calendario 90 dias</Link>
        <Link href="/mkt/agentes">Agentes</Link>
      </div>

      <section aria-label="Campanhas" className="mkt-section">
        <header>
          <p>Campanhas</p>
          <h2>Campanhas ativas e recentes</h2>
        </header>
        <div className="mkt-table-wrap">
          <table className="mkt-table">
            <thead>
              <tr>
                <th scope="col">Nome</th>
                <th scope="col">Status</th>
                <th scope="col">Tipo</th>
                <th scope="col">Canal</th>
                <th scope="col">Budget</th>
                <th scope="col">Gasto</th>
                <th scope="col">ROI</th>
                <th scope="col">Responsavel</th>
              </tr>
            </thead>
            <tbody>
              {campanhas.map((camp) => (
                <tr key={camp.id}>
                  <th scope="row">{camp.nome}</th>
                  <td>
                    <span className={`mkt-badge mkt-badge--${camp.status}`}>{camp.status}</span>
                  </td>
                  <td>{camp.tipo}</td>
                  <td>{camp.canal}</td>
                  <td>{formatBRL(camp.budget)}</td>
                  <td>{formatBRL(camp.gasto)}</td>
                  <td>{camp.roi > 0 ? `${camp.roi}x` : '-'}</td>
                  <td>{camp.responsavel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-label="Campanhas por Status" className="mkt-section">
        <header>
          <p>Distribuicao</p>
          <h2>Campanhas por status e canal</h2>
        </header>
        <div className="mkt-status-grid">
          {kpis.campanhas_por_status.map((item) => (
            <article key={item.name} className="mkt-status-card">
              <span className={`mkt-badge mkt-badge--${item.name}`}>{item.name}</span>
              <strong>{item.value}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="mkt-agents" aria-label="Agentes MKT">
        <header>
          <p>OpenClaw</p>
          <h2>6 Agentes de Marketing</h2>
        </header>
        <div className="mkt-agents__grid">
          {mktAgents.map((agent) => (
            <article className="mkt-agent-card" key={agent.name}>
              <h3>{agent.name}</h3>
              <p>{agent.role}</p>
              <span>{agent.trigger}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="mkt-architecture" aria-label="Arquitetura MKT">
        <h2>Arquitetura de Processamento</h2>
        <div className="mkt-architecture__grid">
          {[
            { name: 'Upload & Validacao', desc: 'PDF/DOCX ate 20MB com MIME check' },
            { name: 'BullMQ Orchestration', desc: '5 filas com retry e dead-letter' },
            { name: 'LLM Cascade', desc: 'Ollama L1 -> Claude L2 -> GPT-4o L3' },
            { name: 'SSE Progress Stream', desc: '4 estagios: extracao, analise, geracao, pronto' },
          ].map((item) => (
            <article key={item.name}>
              <h3>{item.name}</h3>
              <p>{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-label="Evolucao" className="mkt-section">
        <header>
          <p>Performance</p>
          <h2>Evolucao dos ultimos 6 meses</h2>
        </header>
        <div className="mkt-table-wrap">
          <table className="mkt-table">
            <thead>
              <tr>
                <th scope="col">Mes</th>
                <th scope="col">Impressoes</th>
                <th scope="col">Cliques</th>
                <th scope="col">Conversoes</th>
                <th scope="col">Gasto</th>
              </tr>
            </thead>
            <tbody>
              {kpis.evolucao_6m.map((item) => (
                <tr key={item.mes}>
                  <th scope="row">{item.mes}</th>
                  <td>{formatNumber(item.impressoes)}</td>
                  <td>{formatNumber(item.cliques)}</td>
                  <td>{formatNumber(item.conversoes)}</td>
                  <td>{formatBRL(item.gasto)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
