'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AgentPicker } from '@fbr/ui';

const agentes = [
  { id: 'ag-extrator', name: 'Extrator Bot', role: 'Extrai SWOT, persona, UVP do documento enviado', status: 'online', trigger: 'Upload PDF/DOCX', queue: 'mkt:upload' },
  { id: 'ag-estrategista', name: 'Estrategista Bot', role: 'Gera posicionamento, canal mix, KPIs e campanhas prioritarias', status: 'online', trigger: 'Diagnostico aprovado', queue: 'mkt:estrategia' },
  { id: 'ag-redator', name: 'Redator Bot', role: 'Cria headlines, CTAs, body copy, landing pages e sequencias de email', status: 'online', trigger: 'Estrategia gerada', queue: 'mkt:copy' },
  { id: 'ag-calendario', name: 'Calendario Bot', role: 'Propoe grade editorial 90 dias com districao organica vs paga', status: 'offline', trigger: 'Redacao pronta', queue: 'mkt:calendario' },
  { id: 'ag-exportador', name: 'Exportador Bot', role: 'Gera PDF executivo (15-30 pag) e PPTX (10-15 slides) com branding', status: 'offline', trigger: 'Aprovacao do cliente', queue: 'mkt:export' },
  { id: 'ag-onboarding', name: 'Onboarding Bot', role: 'Guia o usuario pela primeira estrategia com prompts contextuais', status: 'online', trigger: 'Primeiro acesso', queue: 'mkt:upload' },
];

const arvaMktAgents = [
  { id: 'arva-extrator', name: 'Extrator Bot', role: 'Extracao de documentos', tags: ['mkt', 'documentos'], status: 'active' as const },
  { id: 'arva-estrategista', name: 'Estrategista Bot', role: 'Geracao de estrategia', tags: ['mkt', 'estrategia'], status: 'active' as const },
  { id: 'arva-redator', name: 'Redator Bot', role: 'Copywriting', tags: ['mkt', 'copy'], status: 'active' as const },
  { id: 'arva-calendario', name: 'Calendario Bot', role: 'Grade editorial', tags: ['mkt'], status: 'inactive' as const },
];

export function AgentesShell() {
  const [linked, setLinked] = useState(arvaMktAgents.slice(0, 2));

  return (
    <main className="mkt-shell fbr-shared-theme">
      <nav className="mkt-breadcrumb">
        <Link href="/">Portal</Link>
        <span>/</span>
        <Link href="/mkt">MKT</Link>
        <span>/</span>
        <span>Agentes</span>
      </nav>

      <section className="mkt-hero">
        <div>
          <p>FBR-MKT</p>
          <h1>Agentes OpenClaw</h1>
          <span>6 agentes especializados em marketing com LLM cascade e filas BullMQ.</span>
        </div>
      </section>

      <section className="mkt-agents" aria-label="Agentes MKT">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12 }}>
          <div>
            <p>OpenClaw</p>
            <h2>Agentes de Marketing</h2>
          </div>
          <AgentPicker
            agents={arvaMktAgents}
            companyId="empresa-1"
            linkedAgents={linked}
            moduleId="mkt"
            moduleTags={['mkt']}
            onSelect={({ agent }) => setLinked((current) => (current.some((item) => item.id === agent.id) ? current : [...current, agent]))}
          />
        </header>
        <div className="mkt-agents__grid">
          {agentes.map((agent) => (
            <article className="mkt-agent-card" key={agent.id} style={{ position: 'relative' }}>
              <h3>{agent.name}</h3>
              <p>{agent.role}</p>
              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                <span>{agent.queue}</span>
                <span style={{ background: agent.status === 'online' ? 'rgba(34,197,94,0.18)' : 'rgba(142,164,199,0.12)', color: agent.status === 'online' ? '#86efac' : 'var(--mkt-slate)' }}>
                  {agent.status}
                </span>
              </div>
              <small style={{ display: 'block', marginTop: 8, color: 'var(--mkt-slate)' }}>
                Trigger: {agent.trigger}
              </small>
            </article>
          ))}
        </div>
      </section>

      <section className="mkt-architecture">
        <h2>LLM Cascade</h2>
        <div className="mkt-architecture__grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {[
            { name: 'Ollama (L1)', desc: 'Primario local, baixa latencia, custo zero' },
            { name: 'Claude API (L2)', desc: 'Secundario cloud, alta capacidade de raciocinio' },
            { name: 'GPT-4o (L3)', desc: 'Reserva, ultima camada de fallback automatico' },
          ].map((item) => (
            <article key={item.name}>
              <h3>{item.name}</h3>
              <p>{item.desc}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
