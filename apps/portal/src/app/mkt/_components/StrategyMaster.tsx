'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { MktEstrategiaVersao, MktEstrategia } from '@/lib/mkt/types';

export function StrategyMaster() {
  const params = useParams();
  const id = params.id as string;
  const [estrategia, setEstrategia] = useState<MktEstrategia | null>(null);
  const [versoes, setVersoes] = useState<MktEstrategiaVersao[]>([]);
  const [currentVersao, setCurrentVersao] = useState<MktEstrategiaVersao | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    posicionamento: true,
    canais: false,
    kpis: false,
    campanhas: false,
  });

  const headers = {
    'x-user-id': '33333333-3333-4333-8333-333333333333',
    'x-company-id': '11111111-1111-4111-8111-111111111111',
  };

  const fetchData = useCallback(async () => {
    try {
      const [estrRes, versRes] = await Promise.all([
        fetch(`/api/proxy/mkt/estrategias?page_size=100`, { headers }),
        fetch(`/api/proxy/mkt/estrategias/${id}/versoes`, { headers }),
      ]);

      if (estrRes.ok) {
        const data = await estrRes.json();
        const found = data.estrategias.find((e: MktEstrategia) => e.id === id);
        setEstrategia(found ?? null);
      }

      if (versRes.ok) {
        const data = await versRes.json();
        setVersoes(data.versoes);
        if (data.versoes.length > 0) setCurrentVersao(data.versoes[0]);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggle = (key: string) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  if (loading) return <main className="mkt-shell fbr-shared-theme"><p>Carregando...</p></main>;

  if (!currentVersao) {
    return (
      <main className="mkt-shell fbr-shared-theme">
        <nav className="mkt-breadcrumb">
          <Link href="/">Portal</Link><span>/</span>
          <Link href="/mkt">MKT</Link><span>/</span>
          <span>Estrategia</span>
        </nav>
        <section className="mkt-section">
          <header><p>Aguardando</p><h2>Estrategia ainda nao gerada</h2></header>
          <p>A estrategia sera gerada apos aprovacao do diagnostico.</p>
          <Link href={`/mkt/diagnostico/${id}`}>Ver Diagnostico</Link>
        </section>
      </main>
    );
  }

  const conteudo = currentVersao.conteudo;

  return (
    <main className="mkt-shell fbr-shared-theme">
      <nav className="mkt-breadcrumb">
        <Link href="/">Portal</Link><span>/</span>
        <Link href="/mkt">MKT</Link><span>/</span>
        <Link href="/mkt/estrategias">Estrategias</Link><span>/</span>
        <span>{estrategia?.nome ?? 'Estrategia'}</span>
      </nav>

      <section className="mkt-hero">
        <div>
          <p>FBR-MKT</p>
          <h1>{estrategia?.nome ?? 'Estrategia Master'}</h1>
          <span>Versao {currentVersao.versao} · Gerado por {currentVersao.gerado_por}</span>
        </div>
      </section>

      {versoes.length > 1 && (
        <div className="mkt-version-selector">
          <label>Versao:</label>
          <select
            value={currentVersao.versao}
            onChange={(e) => {
              const v = versoes.find((vv) => vv.versao === Number(e.target.value));
              if (v) setCurrentVersao(v);
            }}
          >
            {versoes.map((v) => (
              <option key={v.versao} value={v.versao}>v{v.versao} - {new Date(v.created_at ?? '').toLocaleDateString('pt-BR')}</option>
            ))}
          </select>
        </div>
      )}

      <div className="mkt-strategy-nav">
        <Link href={`/mkt/estrategias/${id}`}>Estrategia</Link>
        <Link href={`/mkt/estrategias/${id}/copy`}>Copy</Link>
        <Link href={`/mkt/estrategias/${id}/calendario`}>Calendario</Link>
        <Link href={`/mkt/estrategias/${id}/roadmap`}>Roadmap</Link>
        <Link href={`/mkt/estrategias/${id}/export`}>Exportar</Link>
      </div>

      <section className="mkt-section">
        <button className="mkt-collapsible-header" onClick={() => toggle('posicionamento')}>
          <h2>{expanded.posicionamento ? '▼' : '▶'} Posicionamento</h2>
        </button>
        {expanded.posicionamento && (
          <div className="mkt-collapsible-content">
            <div className="mkt-strategy-grid">
              <div className="mkt-strategy-item">
                <h4>Brand Archetype</h4>
                <p>{conteudo.posicionamento.brand_archetype}</p>
              </div>
              <div className="mkt-strategy-item">
                <h4>Tom de Voz</h4>
                <p>{conteudo.posicionamento.tom_de_voz}</p>
              </div>
              <div className="mkt-strategy-item">
                <h4>UVP</h4>
                <p>{conteudo.posicionamento.uvp}</p>
              </div>
              <div className="mkt-strategy-item">
                <h4>Posicionamento</h4>
                <p>{conteudo.posicionamento.posicionamento_mercado}</p>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="mkt-section">
        <button className="mkt-collapsible-header" onClick={() => toggle('canais')}>
          <h2>{expanded.canais ? '▼' : '▶'} Mix de Canais</h2>
        </button>
        {expanded.canais && (
          <div className="mkt-collapsible-content">
            <div className="mkt-channels-list">
              {conteudo.mix_canais.map((c, i) => (
                <div key={i} className="mkt-channel-item">
                  <div className="mkt-channel-header">
                    <strong>{c.nome}</strong>
                    <span className="mkt-badge mkt-badge--ativa">{c.percentual_alocacao}%</span>
                  </div>
                  <p>{c.justificativa}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="mkt-section">
        <button className="mkt-collapsible-header" onClick={() => toggle('kpis')}>
          <h2>{expanded.kpis ? '▼' : '▶'} KPIs por Canal</h2>
        </button>
        {expanded.kpis && (
          <div className="mkt-collapsible-content">
            <div className="mkt-table-wrap">
              <table className="mkt-table">
                <thead>
                  <tr>
                    <th>Canal</th><th>CAC</th><th>LTV</th><th>Conversao</th><th>ROI</th>
                  </tr>
                </thead>
                <tbody>
                  {conteudo.kpis.map((k, i) => (
                    <tr key={i}>
                      <th>{k.canal}</th>
                      <td>{k.cac ?? '-'}</td>
                      <td>{k.ltv ?? '-'}</td>
                      <td>{k.taxa_conversao ?? '-'}</td>
                      <td>{k.roi ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <section className="mkt-section">
        <button className="mkt-collapsible-header" onClick={() => toggle('campanhas')}>
          <h2>{expanded.campanhas ? '▼' : '▶'} Campanhas Prioritarias</h2>
        </button>
        {expanded.campanhas && (
          <div className="mkt-collapsible-content">
            <div className="mkt-campaigns-grid">
              {conteudo.campanhas.map((camp, i) => (
                <div key={i} className="mkt-campaign-card">
                  <div className="mkt-campaign-header">
                    <h3>{camp.nome}</h3>
                    <span className="mkt-badge mkt-badge--planejada">#{camp.prioridade}</span>
                  </div>
                  <p className="mkt-campaign-objetivo">{camp.objetivo_smart}</p>
                  <div className="mkt-campaign-meta">
                    <span>📺 {camp.canal}</span>
                    <span>💰 {camp.budget}</span>
                    <span>📅 {camp.timeline}</span>
                  </div>
                  <div className="mkt-campaign-tags">
                    {camp.formatos.map((f, j) => <span key={j} className="mkt-tag">{f}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
