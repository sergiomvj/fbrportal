'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Production, VideoFlowDashboardKpis, Concept, TemplatePreset } from '@/lib/videoflow/types';

type PageId = 'visao' | 'orc' | 'referencias' | 'elementos' | 'editor' | 'publicacao' | 'supervisor' | 'vetor' | 'conceitos' | 'qualidade' | 'custos' | 'handoff';

const statusLabels: Record<string, string> = {
  briefing: 'Briefing',
  orquestrador: 'Orquestrador',
  producao: 'Produção',
  revisao: 'Revisão',
  pacote_pronto: 'Pacote Pronto',
  concluido: 'Concluído',
  falhou: 'Falhou',
};

const statusColors: Record<string, string> = {
  briefing: '#78746C',
  orquestrador: '#A85C08',
  producao: '#1840E8',
  revisao: '#0B7A5C',
  pacote_pronto: '#0B7A5C',
  concluido: '#0B7A5C',
  falhou: '#C01818',
};

const agentInfo = [
  { emoji: '🎼', nome: 'Maestro', funcao: 'Orquestrador', model: 'Claude Sonnet 4.6', desc: 'Orquestra todo o pipeline, define vetor de DA' },
  { emoji: '🎨', nome: 'Curador', funcao: 'Referências', model: 'Gemini 2.5 Flash', desc: 'Busca e analisa referências no banco de conceitos' },
  { emoji: '🧱', nome: 'Arquiteto', funcao: 'Elementos', model: 'Claude Haiku 4.5', desc: 'Seleciona elementos visuais, áudio e assets' },
  { emoji: '✂️', nome: 'Montador', funcao: 'Editor', model: 'Claude Sonnet 4.6', desc: 'Compõe roteiro, storyboard e edição final' },
  { emoji: '📦', nome: 'Empacotador', funcao: 'Publicação', model: 'Claude Haiku 4.5', desc: 'Gera pacote final para publicação' },
  { emoji: '👁️', nome: 'Vigia', funcao: 'Supervisor', model: 'Gemini 2.5 Flash', desc: 'Monitora custos, qualidade e timeline' },
];

const channelLabels: Record<string, string> = {
  instagram_reels: 'Reels',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
};

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
}

function formatDuration(seconds: number) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  if (min === 0) return `${sec}s`;
  return sec > 0 ? `${min}m ${sec}s` : `${min}m`;
}

export function VideoFlowDashboard({
  initialKpis,
  initialProductions,
  initialTemplates,
  initialConcepts,
}: {
  initialKpis: VideoFlowDashboardKpis;
  initialProductions: Production[];
  initialTemplates?: TemplatePreset[];
  initialConcepts?: Concept[];
}) {
  const [activePage, setActivePage] = useState<PageId>('visao');
  const [productions] = useState(initialProductions);
  const [concepts] = useState(initialConcepts || []);

  const showPage = (pageId: PageId) => {
    setActivePage(pageId);
  };

  const pages: { id: PageId; label: string }[] = [
    { id: 'visao', label: 'Visão Geral' },
    { id: 'orc', label: 'Orquestrador' },
    { id: 'referencias', label: 'Referências' },
    { id: 'elementos', label: 'Elementos' },
    { id: 'editor', label: 'Editor' },
    { id: 'publicacao', label: 'Publicação' },
    { id: 'supervisor', label: 'Supervisor' },
    { id: 'vetor', label: 'Vetor DA' },
    { id: 'conceitos', label: 'Banco de Conceitos' },
    { id: 'qualidade', label: 'Qualidade' },
    { id: 'custos', label: 'Custos' },
    { id: 'handoff', label: 'Handoff' },
  ];

  return (
    <main className="videoflow-shell">
      <style jsx>{`
        .videoflow-shell {
          --ink: #0c0b09;
          --ink2: #38352f;
          --ink3: #78746c;
          --ink4: #b0ab9f;
          --paper: #f4f0e8;
          --paper2: #eae6dc;
          --paper3: #dedad0;
          --paper4: #d0ccc0;
          --white: #fdfcf8;
          --accent: #1840e8;
          --teal: #0b7a5c;
          --coral: #d04010;
          --amber: #a85c08;
          --red: #c01818;
          background: var(--paper);
          color: var(--ink);
          min-height: 100vh;
          font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .vf-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
          font-size: 0.85rem;
        }

        .vf-header a {
          color: var(--ink3);
          text-decoration: none;
        }

        .vf-header a:hover {
          color: var(--ink);
        }

        .hero {
          margin-bottom: 2rem;
          padding: 2rem 0;
          border-bottom: 1px solid var(--paper3);
        }

        .hero h1 {
          font-family: 'Instrument Serif', serif;
          font-weight: 400;
          font-size: 3rem;
          letter-spacing: -0.02em;
          margin: 0.5rem 0;
          color: var(--ink);
        }

        .hero p {
          color: var(--ink3);
          font-size: 1rem;
        }

        .hero-stats {
          display: flex;
          gap: 2rem;
          margin-top: 1.5rem;
        }

        .hs-item {
          display: flex;
          flex-direction: column;
        }

        .hs-value {
          font-family: "Instrument Serif", serif;
          font-size: 1.5rem;
          color: var(--accent);
        }

        .hs-label {
          font-size: 0.65rem;
          color: var(--ink3);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .page-nav {
          display: flex;
          gap: 0;
          border-bottom: 1px solid var(--paper3);
          overflow-x: auto;
          margin-bottom: 2rem;
        }

        .page-btn {
          padding: 0.75rem 1.25rem;
          font-size: 0.8rem;
          color: var(--ink3);
          background: transparent;
          border: none;
          cursor: pointer;
          position: relative;
          white-space: nowrap;
          transition: color 0.2s;
        }

        .page-btn:hover {
          color: var(--ink);
        }

        .page-btn.active {
          color: var(--accent);
        }

        .page-btn.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--accent);
        }

        .page-content {
          padding: 0;
        }

        .section-title {
          font-family: 'Instrument Serif', serif;
          font-weight: 400;
          font-size: 1.75rem;
          color: var(--ink);
          margin-bottom: 1.5rem;
        }

        .production-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1rem;
        }

        .production-card {
          background: var(--white);
          border: 1px solid var(--paper3);
          border-radius: 8px;
          padding: 1.25rem;
          transition: all 0.2s;
        }

        .production-card:hover {
          border-color: var(--accent);
          box-shadow: 0 4px 12px rgba(24, 64, 232, 0.1);
        }

        .pc-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.75rem;
        }

        .pc-nome {
          font-weight: 500;
          font-size: 1rem;
          color: var(--ink);
        }

        .pc-status {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.6rem;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .pc-briefing {
          font-size: 0.8rem;
          color: var(--ink3);
          margin-bottom: 0.75rem;
        }

        .pc-meta {
          display: flex;
          gap: 1rem;
          font-size: 0.75rem;
          color: var(--ink4);
        }

        .pc-custo {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.8rem;
          color: var(--accent);
          margin-top: 0.75rem;
        }

        .agent-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .agent-card {
          background: var(--white);
          border: 1px solid var(--paper3);
          border-radius: 8px;
          padding: 1.25rem;
        }

        .ac-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .ac-emoji {
          font-size: 1.5rem;
        }

        .ac-nome {
          font-weight: 500;
          color: var(--ink);
        }

        .ac-funcao {
          font-size: 0.7rem;
          color: var(--ink3);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .ac-model {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.65rem;
          color: var(--accent);
          background: rgba(24, 64, 232, 0.08);
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          display: inline-block;
          margin-bottom: 0.5rem;
        }

        .ac-desc {
          font-size: 0.8rem;
          color: var(--ink3);
          line-height: 1.5;
        }

        .template-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 1rem;
        }

        .template-card {
          background: var(--white);
          border: 1px solid var(--paper3);
          border-radius: 8px;
          padding: 1.25rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .template-card:hover {
          border-color: var(--teal);
        }

        .tc-nome {
          font-weight: 500;
          color: var(--ink);
          margin-bottom: 0.25rem;
        }

        .tc-tipo {
          font-size: 0.7rem;
          color: var(--teal);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .tc-meta {
          font-size: 0.8rem;
          color: var(--ink3);
          margin-top: 0.5rem;
        }

        .concept-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
        }

        .concept-card {
          background: var(--white);
          border: 1px solid var(--paper3);
          border-radius: 8px;
          padding: 1.25rem;
        }

        .cc-titulo {
          font-weight: 500;
          color: var(--ink);
        }

        .cc-canal {
          font-size: 0.7rem;
          color: var(--ink3);
          text-transform: uppercase;
          margin-top: 0.25rem;
        }

        .cc-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
          margin-top: 0.75rem;
        }

        .cc-tag {
          font-size: 0.65rem;
          color: var(--ink3);
          background: var(--paper2);
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
        }

        .cc-score {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.75rem;
          color: var(--teal);
          margin-top: 0.5rem;
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .kpi-card {
          background: var(--white);
          border: 1px solid var(--paper3);
          border-radius: 8px;
          padding: 1.25rem;
          text-align: center;
        }

        .kpi-value {
          font-family: 'Instrument Serif', serif;
          font-size: 1.75rem;
          color: var(--accent);
        }

        .kpi-label {
          font-size: 0.65rem;
          color: var(--ink3);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-top: 0.25rem;
        }

        .vetor-display {
          background: var(--white);
          border: 1px solid var(--paper3);
          border-radius: 8px;
          padding: 1.5rem;
        }

        .vd-group {
          margin-bottom: 1.5rem;
        }

        .vd-group-title {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.7rem;
          color: var(--accent);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 0.75rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--paper3);
        }

        .vd-params {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 0.75rem;
        }

        .vd-param {
          display: flex;
          flex-direction: column;
        }

        .vd-param-name {
          font-size: 0.7rem;
          color: var(--ink3);
        }

        .vd-param-value {
          font-size: 0.85rem;
          color: var(--ink);
          font-weight: 500;
        }

        .empty-state {
          text-align: center;
          padding: 3rem;
          color: var(--ink3);
          background: var(--white);
          border: 1px solid var(--paper3);
          border-radius: 8px;
        }
      `}</style>

      <nav className="vf-header">
        <Link href="/">Portal</Link>
        <span style={{ color: 'var(--ink3)' }}>/</span>
        <span>VideoFlow</span>
      </nav>

      <section className="hero">
        <p>FBR·VideoFlow — Módulo de Produção Autoral de Vídeo</p>
        <h1>Direção de Arte em Escalas</h1>
        <p>6 agentes autônomos, DA Vector, Banco de Conceitos</p>
        <div className="hero-stats">
          <div className="hs-item">
            <span className="hs-value">{initialKpis.agentes_ativos}</span>
            <span className="hs-label">Agentes</span>
          </div>
          <div className="hs-item">
            <span className="hs-value">{initialTemplates?.length || 0}</span>
            <span className="hs-label">Presets</span>
          </div>
          <div className="hs-item">
            <span className="hs-value">{initialKpis.custo_medio_minuto}</span>
            <span className="hs-label">Custo/min</span>
          </div>
          <div className="hs-item">
            <span className="hs-value">{initialKpis.conceitos_aprovados}</span>
            <span className="hs-label">Conceitos</span>
          </div>
        </div>
      </section>

      <div className="page-nav">
        {pages.map((page) => (
          <button
            key={page.id}
            className={`page-btn ${activePage === page.id ? 'active' : ''}`}
            onClick={() => showPage(page.id)}
          >
            {page.label}
          </button>
        ))}
      </div>

      <div className="page-content">
        {activePage === 'visao' && (
          <>
            <div className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-value">{initialKpis.producoes_ativas}</div>
                <div className="kpi-label">Produções Ativas</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-value">{initialKpis.producoes_concluidas}</div>
                <div className="kpi-label">Concluídas</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-value">{formatCurrency(initialKpis.custo_total_mes)}</div>
                <div className="kpi-label">Custo Mês</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-value">{formatCurrency(initialKpis.custo_medio_minuto)}</div>
                <div className="kpi-label">Custo/Min</div>
              </div>
            </div>

            <h2 className="section-title">Produções</h2>
            {productions.length === 0 ? (
              <div className="empty-state">Nenhuma produção encontrada</div>
            ) : (
              <div className="production-grid">
                {productions.map((prod) => (
                  <div key={prod.id} className="production-card">
                    <div className="pc-header">
                      <div className="pc-nome">{prod.nome}</div>
                      <span className="pc-status" style={{ background: `${statusColors[prod.status]}20`, color: statusColors[prod.status] }}>
                        {statusLabels[prod.status]}
                      </span>
                    </div>
                    <div className="pc-briefing">
                      {prod.briefing.objetivo.substring(0, 80)}...
                    </div>
                    <div className="pc-meta">
                      <span>{channelLabels[prod.briefing.canal]}</span>
                      <span>{formatDuration(prod.briefing.duracao_seg)}</span>
                      {prod.etapa_pipeline && <span>→ {prod.etapa_pipeline}</span>}
                    </div>
                    {prod.custo_estimado > 0 && (
                      <div className="pc-custo">
                        Est: {formatCurrency(prod.custo_estimado)} | Real: {formatCurrency(prod.custo_real)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activePage === 'orc' && (
          <>
            <h2 className="section-title">Orquestrador</h2>
            <div className="agent-grid">
              {agentInfo.slice(0, 1).map((agent) => (
                <div key={agent.nome} className="agent-card">
                  <div className="ac-header">
                    <span className="ac-emoji">{agent.emoji}</span>
                    <div>
                      <div className="ac-nome">{agent.nome}</div>
                      <div className="ac-funcao">{agent.funcao}</div>
                    </div>
                  </div>
                  <div className="ac-model">{agent.model}</div>
                  <div className="ac-desc">{agent.desc}</div>
                </div>
              ))}
            </div>
            <p style={{ color: 'var(--ink3)', fontSize: '0.9rem' }}>
              O Orquestrador (Maestro) define o Vetor de DA no início de cada produção e coordena todos os agentes downstream.
            </p>
          </>
        )}

        {activePage === 'referencias' && (
          <>
            <h2 className="section-title">Referências — Agent Stack</h2>
            <div className="agent-grid">
              {agentInfo.slice(1, 3).map((agent) => (
                <div key={agent.nome} className="agent-card">
                  <div className="ac-header">
                    <span className="ac-emoji">{agent.emoji}</span>
                    <div>
                      <div className="ac-nome">{agent.nome}</div>
                      <div className="ac-funcao">{agent.funcao}</div>
                    </div>
                  </div>
                  <div className="ac-model">{agent.model}</div>
                  <div className="ac-desc">{agent.desc}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {activePage === 'elementos' && (
          <>
            <h2 className="section-title">Elementos Visuais</h2>
            <div className="agent-grid">
              {agentInfo.slice(2, 3).map((agent) => (
                <div key={agent.nome} className="agent-card">
                  <div className="ac-header">
                    <span className="ac-emoji">{agent.emoji}</span>
                    <div>
                      <div className="ac-nome">{agent.nome}</div>
                      <div className="ac-funcao">{agent.funcao}</div>
                    </div>
                  </div>
                  <div className="ac-model">{agent.model}</div>
                  <div className="ac-desc">{agent.desc}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {activePage === 'editor' && (
          <>
            <h2 className="section-title">Editor — Roteiro e Storyboard</h2>
            <div className="agent-grid">
              {agentInfo.slice(3, 4).map((agent) => (
                <div key={agent.nome} className="agent-card">
                  <div className="ac-header">
                    <span className="ac-emoji">{agent.emoji}</span>
                    <div>
                      <div className="ac-nome">{agent.nome}</div>
                      <div className="ac-funcao">{agent.funcao}</div>
                    </div>
                  </div>
                  <div className="ac-model">{agent.model}</div>
                  <div className="ac-desc">{agent.desc}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {activePage === 'publicacao' && (
          <>
            <h2 className="section-title">Pacote de Publicação</h2>
            <div className="agent-grid">
              {agentInfo.slice(4, 5).map((agent) => (
                <div key={agent.nome} className="agent-card">
                  <div className="ac-header">
                    <span className="ac-emoji">{agent.emoji}</span>
                    <div>
                      <div className="ac-nome">{agent.nome}</div>
                      <div className="ac-funcao">{agent.funcao}</div>
                    </div>
                  </div>
                  <div className="ac-model">{agent.model}</div>
                  <div className="ac-desc">{agent.desc}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {activePage === 'supervisor' && (
          <>
            <h2 className="section-title">Supervisor — Custos e Qualidade</h2>
            <div className="agent-grid">
              {agentInfo.slice(5, 6).map((agent) => (
                <div key={agent.nome} className="agent-card">
                  <div className="ac-header">
                    <span className="ac-emoji">{agent.emoji}</span>
                    <div>
                      <div className="ac-nome">{agent.nome}</div>
                      <div className="ac-funcao">{agent.funcao}</div>
                    </div>
                  </div>
                  <div className="ac-model">{agent.model}</div>
                  <div className="ac-desc">{agent.desc}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {activePage === 'vetor' && (
          <>
            <h2 className="section-title">Vetor de Direção de Arte</h2>
            <div className="vetor-display">
              <div className="vd-group">
                <div className="vd-group-title">Narrativa (7 params)</div>
                <div className="vd-params">
                  <div className="vd-param"><span className="vd-param-name">Tom Emocional</span><span className="vd-param-value">neutro</span></div>
                  <div className="vd-param"><span className="vd-param-name">Arco Dramático</span><span className="vd-param-value">problema-solução</span></div>
                  <div className="vd-param"><span className="vd-param-name">POV</span><span className="vd-param-value">terceira-pessoa</span></div>
                  <div className="vd-param"><span className="vd-param-name">Densidade Info</span><span className="vd-param-value">0.5</span></div>
                  <div className="vd-param"><span className="vd-param-name">Abertura Emocional</span><span className="vd-param-value">gancho_forte</span></div>
                </div>
              </div>
              <div className="vd-group">
                <div className="vd-group-title">Visual (8 params)</div>
                <div className="vd-params">
                  <div className="vd-param"><span className="vd-param-name">Paleta</span><span className="vd-param-value">#1840E8 / #FFFFFF</span></div>
                  <div className="vd-param"><span className="vd-param-name">Temperatura Cor</span><span className="vd-param-value">0</span></div>
                  <div className="vd-param"><span className="vd-param-name">Estilo Visual</span><span className="vd-param-value">corporativo</span></div>
                  <div className="vd-param"><span className="vd-param-name">Movimento Câmera</span><span className="vd-param-value">estático</span></div>
                  <div className="vd-param"><span className="vd-param-name">Transições</span><span className="vd-param-value">corte_seco</span></div>
                </div>
              </div>
              <div className="vd-group">
                <div className="vd-group-title">Sonoro (6 params)</div>
                <div className="vd-params">
                  <div className="vd-param"><span className="vd-param-name">Gênero Musical</span><span className="vd-param-value">corporativo</span></div>
                  <div className="vd-param"><span className="vd-param-name">Energia Trilha</span><span className="vd-param-value">0.5</span></div>
                  <div className="vd-param"><span className="vd-param-name">Presença Voz</span><span className="vd-param-value">voiceover_ai</span></div>
                </div>
              </div>
              <div className="vd-group">
                <div className="vd-group-title">Formato (5 params)</div>
                <div className="vd-params">
                  <div className="vd-param"><span className="vd-param-name">Duração</span><span className="vd-param-value">60s</span></div>
                  <div className="vd-param"><span className="vd-param-name">Proporção</span><span className="vd-param-value">16:9</span></div>
                  <div className="vd-param"><span className="vd-param-name">Plataforma</span><span className="vd-param-value">youtube</span></div>
                  <div className="vd-param"><span className="vd-param-name">Ritmo Corte</span><span className="vd-param-value">0.5</span></div>
                </div>
              </div>
              <div className="vd-group">
                <div className="vd-group-title">Marca (5 params)</div>
                <div className="vd-params">
                  <div className="vd-param"><span className="vd-param-name">Personalidade Marca</span><span className="vd-param-value">-</span></div>
                  <div className="vd-param"><span className="vd-param-name">Restrições Visuais</span><span className="vd-param-value">0 items</span></div>
                </div>
              </div>
              <div className="vd-group">
                <div className="vd-group-title">Meta (4 params)</div>
                <div className="vd-params">
                  <div className="vd-param"><span className="vd-param-name">Originalidade</span><span className="vd-param-value">0.5</span></div>
                  <div className="vd-param"><span className="vd-param-name">Grau Convencionalismo</span><span className="vd-param-value">0.5</span></div>
                </div>
              </div>
            </div>
          </>
        )}

        {activePage === 'conceitos' && (
          <>
            <h2 className="section-title">Banco de Conceitos</h2>
            {concepts.length === 0 ? (
              <div className="empty-state">Nenhum conceito no banco</div>
            ) : (
              <div className="concept-grid">
                {concepts.map((concept) => (
                  <div key={concept.id} className="concept-card">
                    <div className="cc-titulo">{concept.titulo}</div>
                    <div className="cc-canal">{concept.canal ? channelLabels[concept.canal] : 'N/A'}</div>
                    <div className="cc-tags">
                      {concept.tags.map((tag, i) => (
                        <span key={i} className="cc-tag">{tag}</span>
                      ))}
                    </div>
                    <div className="cc-score">Score: {concept.score_qualidade?.toFixed(2) || 'N/A'}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activePage === 'custos' && (
          <>
            <h2 className="section-title">Estimativa de Custos</h2>
            <div className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-value">{formatCurrency(initialKpis.custo_total_mes)}</div>
                <div className="kpi-label">Custo Total Mês</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-value">{formatCurrency(initialKpis.custo_medio_minuto)}</div>
                <div className="kpi-label">Por Minuto</div>
              </div>
            </div>
            <p style={{ color: 'var(--ink3)', fontSize: '0.9rem' }}>
              Custo alvo: ~$0.04/minuto com prompt caching (-90%)
            </p>
          </>
        )}

        {activePage === 'handoff' && (
          <>
            <h2 className="section-title">Handoff Envelope</h2>
            <p style={{ color: 'var(--ink3)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Contrato imutável entre agentes com hash SHA-256
            </p>
            <div className="vetor-display">
              <pre style={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace', color: 'var(--ink2)', overflow: 'auto' }}>
{`{
  "production_id": "uuid",
  "versao_schema": "1.0",
  "briefing": { /* dados do briefing */ },
  "vetor_da": { /* 35+ parâmetros em 6 grupos */ },
  "esqueleto": { /* conceito similar recuperado */ },
  "memoria_de_marca": { /* brand kit, tom, restrições */ },
  "pipeline": {
    "etapa_atual": "string",
    "etapas_concluidas": [],
    "historico": [ /* agente, timestamp, hash */ ]
  },
  "hash_envelope": "sha256"
}`}
              </pre>
            </div>
          </>
        )}

        {(activePage === 'qualidade' || activePage === 'referencias') && (
          <div className="empty-state">
            Página em desenvolvimento
          </div>
        )}
      </div>
    </main>
  );
}