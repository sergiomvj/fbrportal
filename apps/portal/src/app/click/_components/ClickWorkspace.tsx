'use client';

import { useMemo, useState } from 'react';
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
      <section className="click-hero">
        <div>
          <p>FBR-Click CRM</p>
          <h1>Pipeline comercial assistido por agentes</h1>
          <span>Deals, mensagens, tarefas, auditoria e handoff do FBR-Leads em um fluxo unico.</span>
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

      <section className="click-architecture" aria-label="Arquitetura Click">
        {['Portal Proxy', 'Click Backend', 'Arva Gateway', 'Leads Bridge'].map((item) => (
          <article key={item}>{item}</article>
        ))}
      </section>

      <section className="click-security" aria-label="Grid de seguranca">
        {['X-User-Id', 'Workspace isolation', 'RLS esperado', 'Audit append-only'].map((item) => (
          <article key={item}>{item}</article>
        ))}
      </section>

      <CreateDealModal open={modalOpen} onClose={() => setModalOpen(false)} onCreate={createDeal} />
    </main>
  );
}
