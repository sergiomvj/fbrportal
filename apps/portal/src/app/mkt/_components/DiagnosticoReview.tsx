'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { SwotMatrix } from './SwotMatrix';
import { PersonaCard } from './PersonaCard';
import { ScoreGauge } from './ScoreGauge';
import type { MktDiagnostico, MktEstrategia, MktSseEvent } from '@/lib/mkt/types';

export function DiagnosticoReview() {
  const params = useParams();
  const id = params.id as string;
  const [estrategia, setEstrategia] = useState<MktEstrategia | null>(null);
  const [diagnostico, setDiagnostico] = useState<MktDiagnostico | null>(null);
  const [sseEvent, setSseEvent] = useState<MktSseEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [estrRes, diagRes] = await Promise.all([
        fetch(`/api/proxy/mkt/estrategias?page_size=100`),
        fetch(`/api/proxy/mkt/estrategias/${id}/diagnostico`),
      ]);

      if (estrRes.ok) {
        const data = await estrRes.json();
        const found = data.estrategias.find((e: MktEstrategia) => e.id === id);
        setEstrategia(found ?? null);
      }

      if (diagRes.ok) {
        const data = await diagRes.json();
        setDiagnostico(data.diagnostico);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();

    const es = new EventSource(`/api/proxy/mkt/estrategias/${id}/status`, {
      withCredentials: false,
    });

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as MktSseEvent;
        setSseEvent(data);
        if (data.stage === 'pronto') {
          fetchData();
          es.close();
        }
      } catch { /* ignore parse errors */ }
    };

    es.onerror = () => {
      setTimeout(() => fetchData(), 2000);
    };

    return () => es.close();
  }, [id, fetchData]);

  const handleApprove = async () => {
    setApproving(true);
    try {
      const res = await fetch(`/api/proxy/mkt/estrategias/${id}/aprovar-diagnostico`, {
        method: 'POST',
        
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message ?? 'Erro ao aprovar');
      }
      window.location.href = `/mkt/estrategias/${id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao aprovar');
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <main className="mkt-shell fbr-shared-theme">
        <p>Carregando diagnostico...</p>
      </main>
    );
  }

  if (estrategia?.status === 'processando' && sseEvent) {
    return (
      <main className="mkt-shell fbr-shared-theme">
        <nav className="mkt-breadcrumb">
          <Link href="/">Portal</Link><span>/</span>
          <Link href="/mkt">MKT</Link><span>/</span>
          <span>Processando</span>
        </nav>
        <section className="mkt-section">
          <header><p>Progresso</p><h2>Extraindo diagnostico...</h2></header>
          <div className="mkt-progress">
            <div className="mkt-progress-bar">
              <div className="mkt-progress-fill" style={{ width: `${sseEvent.progress}%` }} />
            </div>
            <p>{sseEvent.message}</p>
            <small>{sseEvent.progress}% - {sseEvent.stage}</small>
          </div>
        </section>
      </main>
    );
  }

  if (!diagnostico) {
    return (
      <main className="mkt-shell fbr-shared-theme">
        <p>Diagnostico nao encontrado.</p>
        <Link href="/mkt">Voltar ao Dashboard</Link>
      </main>
    );
  }

  return (
    <main className="mkt-shell fbr-shared-theme">
      <nav className="mkt-breadcrumb">
        <Link href="/">Portal</Link><span>/</span>
        <Link href="/mkt">MKT</Link><span>/</span>
        <span>Diagnostico</span>
      </nav>

      <section className="mkt-hero">
        <div>
          <p>FBR-MKT</p>
          <h1>Revisao do Diagnostico</h1>
          <span>{estrategia?.nome ?? 'Estrategia'}</span>
        </div>
      </section>

      {error && <div className="mkt-alert mkt-alert--error">{error}</div>}

      <div className="mkt-diagnostico-grid">
        <section className="mkt-section">
          <header><p>Analise</p><h2>Matriz SWOT</h2></header>
          <SwotMatrix swot={diagnostico.swot} />
        </section>

        <section className="mkt-section">
          <header><p>Persona</p><h2>Perfil do Publico</h2></header>
          <PersonaCard persona={diagnostico.persona} />
        </section>
      </div>

      <div className="mkt-diagnostico-row">
        <section className="mkt-section">
          <header><p>UVP</p><h2>Proposta de Valor</h2></header>
          <div className="mkt-uvp-display">
            <p>{diagnostico.uvp}</p>
          </div>
        </section>

        <section className="mkt-section">
          <header><p>Viabilidade</p><h2>Score de Marketing</h2></header>
          <ScoreGauge score={diagnostico.score_viab} justificativa={diagnostico.justificativa} />
        </section>
      </div>

      {diagnostico.score_viab < 30 && (
        <div className="mkt-alert mkt-alert--warning">
          Score baixo: a estrategia pode ter limitacoes significativas.
        </div>
      )}

      <div className="mkt-actions">
        <button
          className="mkt-submit-btn"
          onClick={handleApprove}
          disabled={approving || diagnostico.aprovado}
        >
          {diagnostico.aprovado ? 'Ja Aprovado' : approving ? 'Aprovando...' : 'Aprovar e Gerar Estrategia'}
        </button>
        <Link href="/mkt/novo" className="mkt-link-btn">
          Rejeitar e Reenviar Documento
        </Link>
      </div>
    </main>
  );
}
