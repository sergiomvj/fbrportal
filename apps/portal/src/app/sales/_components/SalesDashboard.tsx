'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { Partner, DashboardKpis, EspacoPublicitario, Anomaly, MediaKit, PartnerStage } from '@/lib/sales/types';

const stageLabels: Record<PartnerStage, string> = {
  prospect: 'Prospect',
  negociacao: 'Negociação',
  contract: 'Contrato',
  onboarding: 'Onboarding',
  active: 'Ativo',
  paused: 'Pausado',
  encerrado: 'Encerrado',
};

const stageColors: Record<PartnerStage, string> = {
  prospect: '#22C55E',
  negociacao: '#16A34A',
  contract: '#15803D',
  onboarding: '#166534',
  active: '#14532D',
  paused: '#991B1B',
  encerrado: '#6B7280',
};



const playerGridInfo = [
  { nome: 'Google AdSense/GAM', tipo: 'Ad Network', canal: 'Display/Video', modelo: 'CPM/CPC' },
  { nome: 'Taboola', tipo: 'Ad Network', canal: 'Native', modelo: 'CPM' },
  { nome: 'Outbrain', tipo: 'Ad Network', canal: 'Native', modelo: 'CPM' },
  { nome: 'Mgid', tipo: 'Ad Network', canal: 'Native', modelo: 'CPM' },
  { nome: 'Ezoic', tipo: 'Ad Network', canal: 'Display', modelo: 'CPM/RPM' },
  { nome: 'Mediavine', tipo: 'Ad Network', canal: 'Display/Video', modelo: 'CPM' },
  { nome: 'YouTube Partner', tipo: 'Ad Network', canal: 'Video', modelo: 'CPM' },
  { nome: 'Patrocínios Diretos', tipo: 'Patrocínio', canal: '多元', modelo: 'Fixed' },
];

const agentCards = [
  { emoji: '💼', nome: 'Maia Mendes', funcao: 'Gerente Comercial', descricao: 'Líder virtual do time, coordena todos os agentes' },
  { emoji: '🔭', nome: 'Scout', funcao: 'Prospector', descricao: 'Identifica novas redes e oportunidades' },
  { emoji: '📋', nome: 'Nexus', funcao: 'Proposta Bot', descricao: 'Gera propostas comerciais personalizadas' },
  { emoji: '⚙️', nome: 'Onboard', funcao: 'Onboarding Bot', descricao: 'Conduz o onboarding técnico do parceiro' },
  { emoji: '👁️', nome: 'Vigil', funcao: 'Monitor SLA', descricao: 'Monitora SLAs de pagamento e entrega' },
  { emoji: '📰', nome: 'Quill', funcao: 'Media Kit Bot', descricao: 'Gera e atualiza media kits automaticamente' },
  { emoji: '📒', nome: 'Ledger', funcao: 'Reconciliador', descricao: 'Reconcilia valores esperados vs. recebidos' },
  { emoji: '🎨', nome: 'Auris', funcao: 'Design Approval', descricao: 'Coordena aprovação de criativos' },
  { emoji: '📈', nome: 'Pulse', funcao: 'Anomaly Detector', descricao: 'Detecta anomalias em pagamentos' },
];

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function calculateDaysInStage(updatedAt?: string, createdAt?: string): number {
  const date = new Date(updatedAt || createdAt || new Date().toISOString());
  const now = new Date();
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

function calculateCpmDinamico(cpmBase: number, ocupacao: number): number {
  let multOcupacao: number;
  if (ocupacao < 30) multOcupacao = 0.8;
  else if (ocupacao < 60) multOcupacao = 1.0;
  else if (ocupacao < 80) multOcupacao = 1.2;
  else multOcupacao = 1.5;
  return Math.round(cpmBase * multOcupacao * 100) / 100;
}

type TabType = 'pipeline' | 'espacos' | 'financeiro' | 'mediakit';

export function SalesDashboard({
  initialKpis,
  initialPartners,
  initialEspacos,
  initialAnomalias,
  initialMediaKits,
}: {
  initialKpis: DashboardKpis;
  initialPartners: Partner[];
  initialEspacos?: EspacoPublicitario[];
  initialAnomalias?: Anomaly[];
  initialMediaKits?: MediaKit[];
}) {
  const [activeTab, setActiveTab] = useState<TabType>('pipeline');
  const [partners] = useState(initialPartners);
  const [espacos] = useState<EspacoPublicitario[]>(initialEspacos || []);
  const [anomalias] = useState<Anomaly[]>(initialAnomalias || []);
  const [mediaKits] = useState<MediaKit[]>(initialMediaKits || []);

  const pipelineStages: PartnerStage[] = ['prospect', 'negociacao', 'contract', 'onboarding', 'active'];

  const partnersByStage = useMemo(() => {
    const result: Record<PartnerStage, Partner[]> = {
      prospect: [],
      negociacao: [],
      contract: [],
      onboarding: [],
      active: [],
      paused: [],
      encerrado: [],
    };
    partners.forEach((p) => {
      if (result[p.estagio]) {
        result[p.estagio].push(p);
      }
    });
    return result;
  }, [partners]);

  return (
    <main className="sales-shell">
      <style jsx>{`
        .sales-shell {
          --sales: #22C55E;
          --sales-dim: rgba(34,197,94,0.2);
          --sales-faint: rgba(34,197,94,0.05);
          --dark: #07090F;
          --dark-2: #0C0F1C;
          --dark-3: #111528;
          --dark-4: #191E36;
          --dark-5: #222845;
          --slate: #7278A0;
          --slate-light: #A0A8CC;
          --white: #EDF0FF;
          --brand: #F97316;
          --brand-dim: rgba(249,115,22,0.2);
          --brand-faint: rgba(249,115,22,0.06);
          --warn: #F59E0B;
          --warn-dim: rgba(245,158,11,0.2);
          --warn-faint: rgba(245,158,11,0.05);
          --pipe: #6366F1;
          --fin: #22D3EE;
          --agent: #A78BFA;
          --grid-line: rgba(249,115,22,0.04);
          background: var(--dark);
          color: var(--white);
          min-height: 100vh;
          padding: 1.5rem 2rem;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .sales-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
          font-size: 0.85rem;
        }

        .sales-header a {
          color: var(--slate);
          text-decoration: none;
        }

        .sales-header a:hover {
          color: var(--white);
        }

        .hero {
          margin-bottom: 2rem;
        }

        .hero h1 {
          font-family: 'Outfit', sans-serif;
          font-weight: 900;
          font-size: 2.5rem;
          letter-spacing: -0.03em;
          margin: 0.5rem 0;
        }

        .hero h1 span {
          color: var(--brand);
        }

        .hero p {
          color: var(--slate);
          font-size: 1rem;
        }

        .ticker-wrap {
          border: 1px solid var(--sales-dim);
          border-radius: 12px;
          background: var(--sales-faint);
          padding: 1rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 2rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }

        .ticker-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.6rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--sales);
          opacity: 0.8;
        }

        .ticker-items {
          display: flex;
          gap: 2rem;
          flex-wrap: wrap;
        }

        .ticker-item {
          text-align: center;
        }

        .ticker-value {
          font-family: 'Outfit', sans-serif;
          font-weight: 900;
          font-size: 1.4rem;
          color: var(--sales);
          line-height: 1;
        }

        .ticker-desc {
          font-size: 0.6rem;
          color: var(--slate);
          margin-top: 0.2rem;
        }

        .tabs {
          display: flex;
          gap: 0.25rem;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid var(--dark-4);
        }

        .tab {
          padding: 0.75rem 1.5rem;
          font-size: 0.85rem;
          color: var(--slate);
          background: transparent;
          border: none;
          cursor: pointer;
          position: relative;
          transition: color 0.2s;
        }

        .tab:hover {
          color: var(--white);
        }

        .tab.active {
          color: var(--sales);
        }

        .tab.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--sales);
        }

        .pipeline-track {
          display: flex;
          gap: 0;
          border: 1px solid var(--dark-4);
          border-radius: 16px;
          overflow: hidden;
          margin-bottom: 2rem;
        }

        .pipeline-col {
          flex: 1;
          padding: 1.25rem 1rem;
          border-right: 1px solid var(--dark-4);
          min-height: 300px;
        }

        .pipeline-col:last-child {
          border-right: none;
        }

        .pipeline-col-header {
          text-align: center;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--dark-4);
          margin-bottom: 1rem;
        }

        .pipeline-col-num {
          font-family: 'Outfit', sans-serif;
          font-weight: 900;
          font-size: 1.8rem;
          line-height: 1;
          opacity: 0.18;
          color: var(--brand);
        }

        .pipeline-col-name {
          font-family: 'Outfit', sans-serif;
          font-weight: 700;
          font-size: 0.8rem;
          color: var(--white);
          margin-top: 0.5rem;
        }

        .partner-card {
          background: rgba(255,255,255,0.015);
          border: 1px solid var(--dark-4);
          border-radius: 10px;
          padding: 1rem;
          margin-bottom: 0.75rem;
          transition: all 0.2s;
          cursor: pointer;
        }

        .partner-card:hover {
          border-color: var(--sales-dim);
          background: var(--sales-faint);
        }

        .partner-card.stalled {
          border-color: rgba(248,113,113,0.4);
          background: rgba(248,113,113,0.08);
        }

        .partner-name {
          font-family: 'Outfit', sans-serif;
          font-weight: 700;
          font-size: 0.85rem;
          color: var(--white);
          margin-bottom: 0.25rem;
        }

        .partner-type {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.55rem;
          color: var(--slate);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .partner-value {
          font-size: 0.8rem;
          color: var(--sales);
          margin-top: 0.5rem;
          font-weight: 600;
        }

        .partner-days {
          font-size: 0.65rem;
          color: var(--slate);
          margin-top: 0.25rem;
        }

        .player-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 0.75rem;
          margin-bottom: 2rem;
        }

        .player-card {
          background: rgba(255,255,255,0.015);
          border: 1px solid var(--dark-4);
          border-radius: 10px;
          padding: 1rem 1.25rem;
          transition: all 0.2s;
        }

        .player-card:hover {
          border-color: var(--brand-dim);
          background: var(--brand-faint);
          transform: translateY(-2px);
        }

        .player-nome {
          font-family: 'Outfit', sans-serif;
          font-weight: 700;
          font-size: 0.85rem;
          color: var(--white);
        }

        .player-tipo {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.6rem;
          color: var(--slate);
          text-transform: uppercase;
          margin-top: 0.25rem;
        }

        .player-canal {
          font-size: 0.7rem;
          color: var(--slate-light);
          margin-top: 0.25rem;
        }

        .player-model {
          display: inline-block;
          margin-top: 0.5rem;
          font-size: 0.6rem;
          font-weight: 600;
          padding: 0.15rem 0.5rem;
          border-radius: 4px;
          background: var(--brand-faint);
          color: var(--brand);
          border: 1px solid var(--brand-dim);
        }

        .ag-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .ag-card {
          background: rgba(167,139,250,0.08);
          border: 1px solid rgba(167,139,250,0.2);
          border-radius: 12px;
          padding: 1.25rem;
          transition: all 0.25s;
        }

        .ag-card:hover {
          background: rgba(167,139,250,0.12);
          transform: translateY(-3px);
        }

        .ag-emoji {
          font-size: 1.5rem;
          display: block;
          margin-bottom: 0.75rem;
        }

        .ag-nome {
          font-family: 'Outfit', sans-serif;
          font-weight: 700;
          font-size: 0.85rem;
          color: var(--white);
        }

        .ag-funcao {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.55rem;
          color: var(--agent);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-top: 0.25rem;
        }

        .ag-desc {
          font-size: 0.7rem;
          color: var(--slate-light);
          margin-top: 0.5rem;
          line-height: 1.4;
        }

        .espacos-table {
          width: 100%;
          border-collapse: collapse;
        }

        .espacos-table th {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.6rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--slate);
          text-align: left;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid var(--dark-4);
        }

        .espacos-table td {
          padding: 1rem;
          border-bottom: 1px solid rgba(255,255,255,0.03);
          font-size: 0.85rem;
        }

        .espaco-nome {
          font-weight: 600;
          color: var(--white);
        }

        .espaco-tipo {
          font-size: 0.7rem;
          color: var(--slate);
        }

        .ocupacao-bar {
          height: 6px;
          background: var(--dark-4);
          border-radius: 3px;
          overflow: hidden;
          width: 100px;
          margin-top: 0.25rem;
        }

        .ocupacao-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s;
        }

        .cpm-badge {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
        }

        .cpm-dinamic {
          background: var(--sales-faint);
          color: var(--sales);
          border: 1px solid var(--sales-dim);
        }

        .anomalia-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
        }

        .anomalia-card {
          background: rgba(255,255,255,0.015);
          border: 1px solid var(--dark-4);
          border-radius: 12px;
          padding: 1.25rem;
        }

        .anomalia-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.75rem;
        }

        .anomalia-tipo {
          font-family: 'Outfit', sans-serif;
          font-weight: 700;
          font-size: 0.9rem;
          color: var(--white);
        }

        .anomalia-badge {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.6rem;
          font-weight: 600;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          text-transform: uppercase;
        }

        .anomalia-badge.critica {
          background: rgba(248,113,113,0.15);
          color: #F87171;
          border: 1px solid rgba(248,113,113,0.3);
        }

        .anomalia-badge.alta {
          background: var(--warn-faint);
          color: var(--warn);
          border: 1px solid var(--warn-dim);
        }

        .anomalia-badge.media {
          background: rgba(251,191,36,0.1);
          color: #FBBF24;
          border: 1px solid rgba(251,191,36,0.2);
        }

        .anomalia-badge.baixa {
          background: rgba(107,114,128,0.15);
          color: #9CA3AF;
          border: 1px solid rgba(107,114,128,0.3);
        }

        .anomalia-desc {
          font-size: 0.8rem;
          color: var(--slate-light);
          line-height: 1.5;
        }

        .anomalia-parceiro {
          font-size: 0.7rem;
          color: var(--slate);
          margin-top: 0.75rem;
        }

        .mediakit-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
        }

        .mediakit-card {
          background: rgba(255,255,255,0.015);
          border: 1px solid var(--dark-4);
          border-radius: 12px;
          padding: 1.25rem;
        }

        .mediakit-nome {
          font-family: 'Outfit', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          color: var(--white);
        }

        .mediakit-produto {
          font-size: 0.75rem;
          color: var(--slate);
          margin-top: 0.25rem;
        }

        .mediakit-periodo {
          font-size: 0.8rem;
          color: var(--slate-light);
          margin-top: 0.5rem;
        }

        .mediakit-status {
          display: inline-block;
          margin-top: 0.75rem;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.6rem;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
        }

        .mediakit-status.concluido {
          background: var(--sales-faint);
          color: var(--sales);
          border: 1px solid var(--sales-dim);
        }

        .mediakit-status.gerando {
          background: var(--warn-faint);
          color: var(--warn);
          border: 1px solid var(--warn-dim);
        }

        .kpis-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .kpi-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--dark-4);
          border-radius: 12px;
          padding: 1.25rem;
          text-align: center;
        }

        .kpi-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.6rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--slate);
          margin-bottom: 0.5rem;
        }

        .kpi-value {
          font-family: 'Outfit', sans-serif;
          font-weight: 900;
          font-size: 1.6rem;
          color: var(--sales);
        }

        .kpi-value.positive {
          color: var(--sales);
        }

        .kpi-value.negative {
          color: #F87171;
        }

        .kpi-sub {
          font-size: 0.7rem;
          color: var(--slate);
          margin-top: 0.25rem;
        }

        .section-title {
          font-family: 'Outfit', sans-serif;
          font-weight: 800;
          font-size: 1.5rem;
          color: var(--white);
          margin-bottom: 1.5rem;
        }

        .approval-box {
          border: 1px solid var(--warn-dim);
          border-radius: 12px;
          background: var(--warn-faint);
          padding: 1.25rem 1.5rem;
          margin-bottom: 2rem;
          display: flex;
          gap: 1rem;
          align-items: flex-start;
        }

        .approval-icon {
          font-size: 1.2rem;
        }

        .approval-title {
          font-family: 'Outfit', sans-serif;
          font-weight: 700;
          font-size: 0.9rem;
          color: var(--warn);
        }

        .approval-body {
          font-size: 0.8rem;
          color: var(--slate-light);
        }

        .approval-body strong {
          color: var(--white);
          font-weight: 500;
        }

        .approval-owners {
          display: flex;
          gap: 0.75rem;
          margin-top: 0.75rem;
        }

        .approval-owner {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.65rem;
          color: var(--warn);
          background: rgba(245,158,11,0.1);
          padding: 0.3rem 0.6rem;
          border-radius: 4px;
        }
      `}</style>

      <nav className="sales-header">
        <Link href="/">Portal</Link>
        <span style={{ color: 'var(--slate)' }}>/</span>
        <span>Sales</span>
      </nav>

      <section className="hero">
        <p>FBR·Sales — Motor de Receita</p>
        <h1>Departamento <span>Comercial</span> Digital</h1>
        <p>Pipeline de parcerias, Ad Network API, Financial Control e Media Kit Generator</p>
      </section>

      <div className="ticker-wrap">
        <div className="ticker-label">// métricas mvp</div>
        <div className="ticker-items">
          <div className="ticker-item">
            <div className="ticker-value">{partners.length}</div>
            <div className="ticker-desc">Parceiros</div>
          </div>
          <div className="ticker-item">
            <div className="ticker-value">9</div>
            <div className="ticker-desc">Agentes</div>
          </div>
          <div className="ticker-item">
            <div className="ticker-value">{formatBRL(initialKpis.revenue_total_mes)}</div>
            <div className="ticker-desc">Receita Mês</div>
          </div>
          <div className="ticker-item">
            <div className="ticker-value">{initialKpis.ocupacao_media}%</div>
            <div className="ticker-desc">Ocupação Média</div>
          </div>
          <div className="ticker-item">
            <div className="ticker-value">{initialKpis.anomalias_pendentes.total}</div>
            <div className="ticker-desc">Anomalias</div>
          </div>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'pipeline' ? 'active' : ''}`} onClick={() => setActiveTab('pipeline')}>
          Pipeline de Parcerias
        </button>
        <button className={`tab ${activeTab === 'espacos' ? 'active' : ''}`} onClick={() => setActiveTab('espacos')}>
          Espaços Publicitários
        </button>
        <button className={`tab ${activeTab === 'financeiro' ? 'active' : ''}`} onClick={() => setActiveTab('financeiro')}>
          Financial Control
        </button>
        <button className={`tab ${activeTab === 'mediakit' ? 'active' : ''}`} onClick={() => setActiveTab('mediakit')}>
          Media Kits
        </button>
      </div>

      {activeTab === 'pipeline' && (
        <>
          <div className="approval-box">
            <span className="approval-icon">⚠️</span>
            <div>
              <div className="approval-title">Aprovação Necessária</div>
              <div className="approval-body">
                Propostas, contratos, criativos e comunicação externa requerem aprovação humana antes de envio.
              </div>
              <div className="approval-owners">
                <span className="approval-owner">Sergio Castro</span>
                <span className="approval-owner">Marco Alevato</span>
              </div>
            </div>
          </div>

          <h2 className="section-title">Pipeline de Parceiros</h2>
          <div className="pipeline-track">
            {pipelineStages.map((stage) => (
              <div key={stage} className="pipeline-col">
                <div className="pipeline-col-header">
                  <div className="pipeline-col-num">{partnersByStage[stage].length}</div>
                  <div className="pipeline-col-name" style={{ color: stageColors[stage] }}>
                    {stageLabels[stage]}
                  </div>
                </div>
                {partnersByStage[stage].length === 0 ? (
                  <div style={{ color: 'var(--slate)', fontSize: '0.75rem', textAlign: 'center', padding: '1rem 0' }}>
                    Nenhum parceiro
                  </div>
                ) : (
                  partnersByStage[stage].map((partner) => {
                    const dias = calculateDaysInStage(partner.updated_at, partner.created_at);
                    const isStale = dias > 14 && stage !== 'active' && stage !== 'encerrado';
                    return (
                      <div key={partner.id} className={`partner-card ${isStale ? 'stalled' : ''}`}>
                        <div className="partner-name">{partner.nome}</div>
                        <div className="partner-type">{partner.ad_network || partner.tipo}</div>
                        {partner.valor_estimado && (
                          <div className="partner-value">{formatBRL(partner.valor_estimado)}</div>
                        )}
                        <div className="partner-days">
                          {dias}d no estágio
                          {isStale && <span style={{ color: '#F87171', marginLeft: '0.5rem' }}>⚠️</span>}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ))}
          </div>

          <h2 className="section-title">Players de Monetização</h2>
          <div className="player-grid">
            {playerGridInfo.map((player, i) => (
              <div key={i} className="player-card">
                <div className="player-nome">{player.nome}</div>
                <div className="player-tipo">{player.tipo}</div>
                <div className="player-canal">{player.canal}</div>
                <div className="player-model">{player.modelo}</div>
              </div>
            ))}
          </div>

          <h2 className="section-title">Time Maia Mendes (Agentes)</h2>
          <div className="ag-grid">
            {agentCards.map((agent, i) => (
              <div key={i} className="ag-card">
                <span className="ag-emoji">{agent.emoji}</span>
                <div className="ag-nome">{agent.nome}</div>
                <div className="ag-funcao">{agent.funcao}</div>
                <div className="ag-desc">{agent.descricao}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'espacos' && (
        <>
          <h2 className="section-title">Espaços Publicitários</h2>
          <table className="espacos-table">
            <thead>
              <tr>
                <th>Espaço</th>
                <th>Produto</th>
                <th>CPM Base</th>
                <th>CPM Dinâmico</th>
                <th>Ocupação</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {espacos.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--slate)', padding: '2rem' }}>
                    Nenhum espaço publicitário encontrado
                  </td>
                </tr>
              ) : (
                espacos.map((espaco) => {
                  const cpmDinamico = calculateCpmDinamico(espaco.cpm_base, espaco.ocupacao);
                  let ocupacaoColor = '#22C55E';
                  if (espaco.ocupacao >= 50 && espaco.ocupacao < 80) ocupacaoColor = '#EAB308';
                  else if (espaco.ocupacao >= 80) ocupacaoColor = '#EF4444';
                  return (
                    <tr key={espaco.id}>
                      <td>
                        <div className="espaco-nome">{espaco.nome}</div>
                        <div className="espaco-tipo">{espaco.tipo} - {espaco.posicao}</div>
                      </td>
                      <td style={{ color: 'var(--slate-light)' }}>{espaco.produto_nome}</td>
                      <td style={{ fontFamily: 'JetBrains Mono', fontSize: '0.8rem' }}>R$ {espaco.cpm_base.toFixed(2)}</td>
                      <td>
                        <span className="cpm-badge cpm-dinamic">
                          R$ {cpmDinamico.toFixed(2)}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.75rem', color: 'var(--white)' }}>{espaco.ocupacao}%</div>
                        <div className="ocupacao-bar">
                          <div className="ocupacao-fill" style={{ width: `${espaco.ocupacao}%`, background: ocupacaoColor }} />
                        </div>
                      </td>
                      <td>
                        <span style={{ color: espaco.ativo ? 'var(--sales)' : 'var(--slate)', fontSize: '0.75rem' }}>
                          {espaco.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </>
      )}

      {activeTab === 'financeiro' && (
        <>
          <div className="kpis-grid">
            <div className="kpi-card">
              <div className="kpi-label">Receita Mês</div>
              <div className="kpi-value positive">{formatBRL(initialKpis.revenue_total_mes)}</div>
              <div className="kpi-sub">
                {initialKpis.revenue_variacao_percentual >= 0 ? '+' : ''}{initialKpis.revenue_variacao_percentual}% vs mês anterior
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Receita Mês Anterior</div>
              <div className="kpi-value">{formatBRL(initialKpis.revenue_total_mes_anterior)}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Forecast Próximo Mês</div>
              <div className="kpi-value">{formatBRL(initialKpis.receita_forecast_proximo_mes)}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Parceiros Ativos</div>
              <div className="kpi-value">{initialKpis.parceiros_ativos}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Em Negociação</div>
              <div className="kpi-value">{initialKpis.parceiros_em_negociacao}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Tickets Pendentes</div>
              <div className="kpi-value" style={{ color: initialKpis.tickets_pendentes > 0 ? '#F87171' : 'var(--sales)' }}>
                {initialKpis.tickets_pendentes}
              </div>
            </div>
          </div>

          <h2 className="section-title">Anomalias Pendentes</h2>
          {anomalias.length === 0 ? (
            <div style={{ color: 'var(--slate)', textAlign: 'center', padding: '2rem', border: '1px solid var(--dark-4)', borderRadius: '12px' }}>
              Nenhuma anomalia pendente
            </div>
          ) : (
            <div className="anomalia-grid">
              {anomalias.map((anomalia) => (
                <div key={anomalia.id} className="anomalia-card">
                  <div className="anomalia-header">
                    <div className="anomalia-tipo">{anomalia.tipo.replace(/_/g, ' ')}</div>
                    <span className={`anomalia-badge ${anomalia.severidade}`}>{anomalia.severidade}</span>
                  </div>
                  <div className="anomalia-desc">{anomalia.descricao}</div>
                  <div className="anomalia-parceiro">Score: {anomalia.score}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'mediakit' && (
        <>
          <h2 className="section-title">Media Kits</h2>
          {mediaKits.length === 0 ? (
            <div style={{ color: 'var(--slate)', textAlign: 'center', padding: '2rem', border: '1px solid var(--dark-4)', borderRadius: '12px' }}>
              Nenhum media kit gerado
            </div>
          ) : (
            <div className="mediakit-grid">
              {mediaKits.map((kit) => (
                <div key={kit.id} className="mediakit-card">
                  <div className="mediakit-nome">{kit.produto_nome}</div>
                  <div className="mediakit-produto">Período: {kit.periodo_inicio} até {kit.periodo_fim}</div>
                  <div className="mediakit-periodo">ID: {kit.id?.substring(0, 8)}...</div>
                  <span className={`mediakit-status ${kit.status}`}>{kit.status}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}