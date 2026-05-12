'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { MktRoadmapTask } from '@/lib/mkt/types';

export function RoadmapView() {
  const params = useParams();
  const id = params.id as string;
  const [tasks, setTasks] = useState<MktRoadmapTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/proxy/mkt/estrategias/${id}/roadmap`)
      .then((r) => r.json())
      .then((d) => setTasks(d.roadmap ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const phases = ['0-30d', '30-60d', '60-90d'] as const;
  const phaseLabels: Record<string, string> = {
    '0-30d': 'Fase 1: Dias 0-30',
    '30-60d': 'Fase 2: Dias 30-60',
    '60-90d': 'Fase 3: Dias 60-90',
  };

  if (loading) return <main className="mkt-shell fbr-shared-theme"><p>Carregando roadmap...</p></main>;

  return (
    <main className="mkt-shell fbr-shared-theme">
      <nav className="mkt-breadcrumb">
        <Link href="/">Portal</Link><span>/</span>
        <Link href="/mkt">MKT</Link><span>/</span>
        <Link href={`/mkt/estrategias/${id}`}>Estrategia</Link><span>/</span>
        <span>Roadmap</span>
      </nav>

      <section className="mkt-hero">
        <div>
          <p>FBR-MKT</p>
          <h1>Roadmap Operacional</h1>
          <span>{tasks.length} tarefas em 3 fases</span>
        </div>
      </section>

      {tasks.length === 0 ? (
        <section className="mkt-section"><p>Roadmap nao gerado ainda.</p></section>
      ) : (
        phases.map((fase) => {
          const faseTasks = tasks.filter((t) => t.fase === fase);
          if (faseTasks.length === 0) return null;
          return (
            <section key={fase} className="mkt-section">
              <header><p>Fase</p><h2>{phaseLabels[fase]}</h2></header>
              <div className="mkt-roadmap-list">
                {faseTasks.map((task) => (
                  <div key={task.id} className={`mkt-roadmap-item mkt-roadmap-item--${task.status}`}>
                    <div className="mkt-roadmap-check">
                      <input type="checkbox" checked={task.status === 'concluido'} readOnly />
                    </div>
                    <div className="mkt-roadmap-content">
                      <strong>{task.item}</strong>
                      <div className="mkt-roadmap-meta">
                        {task.responsavel && <span>👤 {task.responsavel}</span>}
                        {task.ferramenta && <span>🔧 {task.ferramenta}</span>}
                        {task.alerta_prazo && <span className="mkt-alert-text">⏰ {task.alerta_prazo}</span>}
                      </div>
                    </div>
                    <span className={`mkt-badge mkt-badge--${task.status === 'concluido' ? 'ativa' : task.status === 'em_progresso' ? 'planejada' : 'rascunho'}`}>
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          );
        })
      )}
    </main>
  );
}
