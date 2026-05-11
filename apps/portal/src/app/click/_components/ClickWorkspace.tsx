'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { z } from 'zod';
import { clickAgents, clickDeals, clickHistory, clickKpis, clickMessages, clickTasks } from '@/lib/click/fixtures';
import { createDealSchema } from '@/lib/click/schemas';
import type { ClickDeal, ClickMessage, ClickStage } from '@/lib/click/types';
import { AgentDashboard } from './AgentDashboard';
import { CreateDealModal } from './CreateDealModal';
import { DealDetail } from './DealDetail';
import { formatCurrency } from './format';
import { PipelineBoard } from './PipelineBoard';

export function ClickWorkspace() {
  const [deals, setDeals] = useState(clickDeals);
  const [messages, setMessages] = useState(clickMessages);
  const [history, setHistory] = useState(clickHistory);
  const [selectedId, setSelectedId] = useState(clickDeals[0]?.id ?? '');
  const [modalOpen, setModalOpen] = useState(false);
  const selectedDeal = deals.find((deal) => deal.id === selectedId) ?? deals[0];

  const totalValue = useMemo(() => deals.reduce((sum, deal) => sum + deal.valueCents, 0), [deals]);

  const stageCounts = useMemo(() => {
    const counts: Record<ClickStage, number> = { contato_inicial: 0, descoberta: 0, proposta: 0, negociacao: 0, fechamento: 0 };
    for (const deal of deals) counts[deal.stage]++;
    return counts;
  }, [deals]);

  function moveDeal(dealId: string, stage: ClickStage) {
    setDeals((current) =>
      current.map((deal) => (deal.id === dealId ? { ...deal, stage, updatedAt: new Date().toISOString() } : deal)),
    );
    setHistory((current) => [
      ...current,
      {
        id: `history-ui-${current.length + 1}`,
        workspaceId: 'empresa-1',
        dealId,
        type: 'stage_changed',
        actorId: 'operator-1',
        actorType: 'human',
        description: `Estagio alterado para ${stage}.`,
        createdAt: new Date().toISOString(),
      },
    ]);
  }

  function createDeal(input: z.infer<typeof createDealSchema>) {
    const deal = {
      ...input,
      id: `deal-ui-${deals.length + 1}`,
      workspaceId: 'empresa-1',
      userId: 'operator-1',
      empresaId: 'empresa-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as ClickDeal;
    setDeals((current) => [...current, deal]);
    setSelectedId(deal.id);
    return deal;
  }

  function sendMessage(dealId: string, body: string) {
    const message: ClickMessage = {
      id: `message-ui-${messages.length + 1}`,
      workspaceId: 'empresa-1',
      dealId,
      authorId: body.includes('@') ? 'agent-sdr' : 'operator-1',
      actorType: body.includes('@') ? 'agent' : 'human',
      body,
      createdAt: new Date().toISOString(),
    };
    setMessages((current) => [...current, message]);
  }

  return (
    <main className="click-shell fbr-shared-theme">
      <nav className="click-breadcrumb">
        <Link href="/">Portal</Link>
        <span>/</span>
        <span>Click</span>
      </nav>

      <section className="click-hero">
        <div className="click-hero__copy">
          <p>FBR-Click</p>
          <h1>CRM de Pre-Venda</h1>
          <span>Pipeline assistido por 6 agentes com SLA de primeiro contato em ate 2 minutos.</span>
          <div className="click-hero__chips" aria-label="Sinais operacionais Click">
            <span>5 estagios</span>
            <span>6 agentes</span>
            <span>13 tabelas RLS</span>
            <span>Audit infinito</span>
          </div>
        </div>
        <button onClick={() => setModalOpen(true)} type="button">
          Criar deal
        </button>
      </section>

      <section className="click-kpis" aria-label="KPIs Click">
        {clickKpis.map((kpi) => (
          <article key={kpi.id}>
            <span>{kpi.name}</span>
            <strong>{kpi.name.includes('Receita') ? formatCurrency(totalValue) : kpi.value}</strong>
            <small>{kpi.trend > 0 ? '+' : ''}{kpi.trend}%</small>
          </article>
        ))}
      </section>

      <section className="click-funnel" aria-label="Funil de estagios">
        {(['contato_inicial', 'descoberta', 'proposta', 'negociacao', 'fechamento'] as ClickStage[]).map((stage) => (
          <div className="click-funnel__step" key={stage}>
            <strong>{stageCounts[stage]}</strong>
            <small>{stage.replace('_', ' ')}</small>
          </div>
        ))}
      </section>

      <section className="click-workspace-grid">
        <PipelineBoard deals={deals} onMove={moveDeal} onOpen={(deal) => setSelectedId(deal.id)} />
        {selectedDeal && (
          <DealDetail
            deal={selectedDeal}
            history={history}
            messages={messages}
            onMessage={sendMessage}
            onMove={moveDeal}
            tasks={clickTasks}
          />
        )}
      </section>

      <AgentDashboard agents={clickAgents} isAdmin />

      <section className="click-nav-links" aria-label="Navegacao Click">
        <Link href="/click/audit">Audit Log</Link>
        <Link href="/click/kpis">KPIs & Metricas</Link>
      </section>

      <section className="click-architecture" aria-label="Arquitetura Click">
        <h2>Arquitetura de Microservicos</h2>
        <div className="click-architecture__grid">
          {[
            { name: 'Portal Proxy', transport: 'REST', desc: 'Gateway de autenticacao e roteamento' },
            { name: 'Click Backend', transport: 'REST', desc: 'Logica de deals, tarefas e pipeline' },
            { name: 'Arva Gateway', transport: 'SSE', desc: 'Execucao e orquestracao de agentes' },
            { name: 'Leads Bridge', transport: 'Webhook', desc: 'Recepcao de SQLs do FBR-Leads' },
            { name: 'Message Broker', transport: 'SSE', desc: 'Canais de comunicacao em tempo real' },
            { name: 'Audit Service', transport: 'REST', desc: 'Log imutavel append-only' },
          ].map((item) => (
            <article key={item.name}>
              <h3>{item.name}</h3>
              <p>{item.desc}</p>
              <span>{item.transport}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="click-security" aria-label="Grid de seguranca">
        <h2>10 Camadas de Seguranca</h2>
        <div className="click-security__grid">
          {[
            { name: 'iron-session', desc: 'Sessao criptografada com cookie httpOnly' },
            { name: 'JWT Agent Auth', desc: 'Token com escopo e expiracao' },
            { name: 'Workspace Isolation', desc: 'Contexto x-workspace-id obrigatorio' },
            { name: 'RLS', desc: 'Row Level Security no PostgreSQL' },
            { name: 'Rate Limiting', desc: 'Protecao contra abuso de triggers' },
            { name: 'Audit Append-Only', desc: 'Log imutavel de todas as acoes' },
            { name: 'Approval Flow', desc: 'Acoes criticas exigem aprovacao' },
            { name: 'HMAC Webhooks', desc: 'Assinatura de webhooks recebidos' },
            { name: 'Zod Validation', desc: 'Validacao de entrada em todas as rotas' },
            { name: 'Admin Kill Switch', desc: 'Controle total sobre agentes ativos' },
          ].map((item) => (
            <article key={item.name}>
              <strong>{item.name}</strong>
              <p>{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <CreateDealModal open={modalOpen} onClose={() => setModalOpen(false)} onCreate={createDeal} />
    </main>
  );
}
