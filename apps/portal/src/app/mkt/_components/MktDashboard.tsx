'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { MktDashboardKpis, MktEstrategia } from '@/lib/mkt/types';

const mktModules = [
  { icon: '🔐', name: 'Auth', desc: 'Autenticacao e gestao de acesso', href: '/mkt' },
  { icon: '📤', name: 'Diagnostico', desc: 'Upload e extracao de dados', href: '/mkt/novo' },
  { icon: '🔬', name: 'Extracao', desc: 'SWOT, persona, UVP e score', href: '/mkt/novo' },
  { icon: '🧠', name: 'Estrategia', desc: 'Posicionamento e canal mix', href: '/mkt/estrategias' },
  { icon: '📋', name: 'Campanhas', desc: 'Campanhas priorizadas', href: '/mkt/estrategias' },
  { icon: '📅', name: 'Calendario', desc: '90 dias de pauta editorial', href: '/mkt/estrategias' },
  { icon: '🎯', name: 'Lead Magnets', desc: 'Captacao e funil', href: '/mkt/estrategias' },
  { icon: '🗺️', name: 'Roadmap', desc: 'Execucao por fase', href: '/mkt/estrategias' },
  { icon: '📦', name: 'Outputs', desc: 'PDF e PPTX', href: '/mkt/estrategias' },
];

const mktAgents = [
  { icon: '📥', name: 'Extrator', role: 'Extrai SWOT, persona, UVP do documento', queue: 'mkt:upload' },
  { icon: '🧠', name: 'Estrategista', role: 'Gera posicionamento, canal mix, KPIs', queue: 'mkt:estrategia' },
  { icon: '✍️', name: 'Redator', role: 'Headlines, CTAs, copy, landing pages', queue: 'mkt:copy' },
  { icon: '📅', name: 'Calendario', role: 'Propoe grade editorial 90 dias', queue: 'mkt:calendario' },
  { icon: '📦', name: 'Exportador', role: 'Gera PDF executivo e PPTX', queue: 'mkt:export' },
  { icon: '🎓', name: 'Onboarding', role: 'Guia o usuario na primeira estrategia', queue: 'mkt:onboarding' },
];

const serviceLoop = [
  { title: 'Diagnostico', desc: 'Extracao inteligente de dados do negocio' },
  { title: 'Estrategia', desc: 'Geracao de posicionamento e canal mix' },
  { title: 'Copywriting', desc: 'Headlines, CTAs e copy por campanha' },
  { title: 'Calendario', desc: '90 dias de pauta organica e paga' },
  { title: 'Exportacao', desc: 'PDF e PPTX com branding da empresa' },
  { title: 'Iteracao', desc: 'Refinamento via chat contextual' },
];

const pillars = [
  { name: 'Brand Identity', color: '#0EA5E9' },
  { name: 'Target Audience', color: '#8B5CF6' },
  { name: 'Channel Strategy', color: '#F59E0B' },
  { name: 'Conversion Funnel', color: '#10B981' },
  { name: 'KPIs', color: '#EF4444' },
  { name: 'Editorial Calendar', color: '#EC4899' },
  { name: 'Lead Magnets', color: '#14B8A6' },
];

interface DashboardData {
  kpis: MktDashboardKpis;
  estrategias: MktEstrategia[];
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

      const [dashRes, estrRes] = await Promise.all([
        fetch('/api/proxy/mkt/dashboard', { headers }),
        fetch('/api/proxy/mkt/estrategias?page_size=5', { headers }),
      ]);

      if (!dashRes.ok || !estrRes.ok) throw new Error('Erro ao carregar dados');

      const [dashJson, estrJson] = await Promise.all([dashRes.json(), estrRes.json()]);
      setData({ kpis: dashJson.kpis, estrategias: estrJson.estrategias });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <main className="mkt-shell fbr-shared-theme">
        <div className="mkt-loading">Carregando MKT Intelligence Platform...</div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="mkt-shell fbr-shared-theme">
        <div className="mkt-error">Erro: {error ?? 'Dados nao disponiveis'}</div>
      </main>
    );
  }

  const { kpis, estrategias } = data;

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
        <Link href="/mkt/novo" className="mkt-cta-btn">
          Nova Estrategia
        </Link>
      </section>

      <section aria-label="KPIs Marketing" className="mkt-kpis">
        <article>
          <span>Estrategias Ativas</span>
          <strong>{kpis.estrategias_ativas}</strong>
          <small>{kpis.estrategias_processando} processando</small>
        </article>
        <article>
          <span>Diagnosticos</span>
          <strong>{kpis.total_diagnosticos}</strong>
          <small>{kpis.taxa_aprovacao}% aprovacao</small>
        </article>
        <article>
          <span>Exportacoes</span>
          <strong>{kpis.total_exportacoes}</strong>
          <small>PDF e PPTX gerados</small>
        </article>
        <article>
          <span>Tempo Medio</span>
          <strong>&lt;{kpis.tempo_medio_geracao}s</strong>
          <small>geracao de estrategia</small>
        </article>
        <article>
          <span>Agentes Ativos</span>
          <strong>{kpis.agentes_ativos}</strong>
          <small>de 6 slots</small>
        </article>
        <article>
          <span>Jobs com Falha</span>
          <strong>{kpis.jobs_falha}</strong>
          <small>requerem atencao</small>
        </article>
        <article>
          <span>Docs/mes Meta</span>
          <strong>1.000</strong>
          <small>processamentos/mes</small>
        </article>
        <article>
          <span>Retencao Meta</span>
          <strong>60%</strong>
          <small>semanal</small>
        </article>
      </section>

      <section className="mkt-nav-links">
        <Link href="/mkt/novo">Nova Estrategia</Link>
        <Link href="/mkt/estrategias">Estrategias</Link>
        <Link href="/mkt/agentes">Agentes</Link>
      </section>

      <section aria-label="Modulos MKT" className="mkt-section">
        <header>
          <p>Modulos</p>
          <h2>9 Modulos da Plataforma</h2>
        </header>
        <div className="mkt-modules-grid">
          {mktModules.map((mod) => (
            <Link key={mod.name} href={mod.href} className="mkt-module-card">
              <span className="mkt-module-icon">{mod.icon}</span>
              <h3>{mod.name}</h3>
              <p>{mod.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <section aria-label="Pilares" className="mkt-section">
        <header>
          <p>Pilares</p>
          <h2>7 Pilares Estrategicos</h2>
        </header>
        <div className="mkt-pillars-grid">
          {pillars.map((p) => (
            <div key={p.name} className="mkt-pillar-card" style={{ borderColor: p.color }}>
              <div className="mkt-pillar-dot" style={{ background: p.color }} />
              <span>{p.name}</span>
            </div>
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
              <h3>{agent.icon} {agent.name}</h3>
              <p>{agent.role}</p>
              <span>{agent.queue}</span>
            </article>
          ))}
        </div>
      </section>

      <section aria-label="Service Loop" className="mkt-section">
        <header>
          <p>Ciclo</p>
          <h2>Ciclo de Capacidades</h2>
        </header>
        <div className="mkt-service-loop">
          {serviceLoop.map((item, i) => (
            <div key={item.title} className="mkt-service-card">
              <div className="mkt-service-num">{String(i + 1).padStart(2, '0')}</div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {estrategias.length > 0 && (
        <section aria-label="Estrategias Recentes" className="mkt-section">
          <header>
            <p>Recentes</p>
            <h2>Estrategias</h2>
          </header>
          <div className="mkt-table-wrap">
            <table className="mkt-table">
              <thead>
                <tr>
                  <th scope="col">Nome</th>
                  <th scope="col">Status</th>
                  <th scope="col">Versao</th>
                  <th scope="col">Nicho</th>
                </tr>
              </thead>
              <tbody>
                {estrategias.map((e) => (
                  <tr key={e.id}>
                    <th scope="row"><Link href={`/mkt/estrategias/${e.id}`}>{e.nome}</Link></th>
                    <td><span className={`mkt-badge mkt-badge--${e.status}`}>{e.status}</span></td>
                    <td>v{e.versao}</td>
                    <td>{e.nicho ?? '-'}</td>
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
