'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { z } from 'zod';
import { createDealSchema } from '@/lib/click/schemas';
import type { ClickAgent, ClickDeal, ClickDealHistory, ClickKpi, ClickMessage, ClickStage, ClickTask } from '@/lib/click/types';
import { AgentDashboard } from './AgentDashboard';
import { requestJson } from './api';
import { CreateDealModal } from './CreateDealModal';
import { DealDetail } from './DealDetail';
import { formatCurrency } from './format';
import { PipelineBoard } from './PipelineBoard';

const stageLabels: Record<ClickStage, string> = {
  contato_inicial: 'Contato inicial',
  descoberta: 'Descoberta',
  proposta: 'Proposta',
  negociacao: 'Negociacao',
  fechamento: 'Fechamento',
};

const discardReasons = ['Sem fit com ICP', 'Sem resposta apos follow-up', 'Budget insuficiente', 'Concorrente escolhido'] as const;

export function ClickWorkspace({
  companyId,
  initialAgents,
  initialDeals,
  initialHistory,
  initialKpis,
  initialMessages,
  initialTasks,
  isAdmin,
}: {
  companyId: string;
  initialAgents: ClickAgent[];
  initialDeals: ClickDeal[];
  initialHistory: ClickDealHistory[];
  initialKpis: ClickKpi[];
  initialMessages: ClickMessage[];
  initialTasks: ClickTask[];
  isAdmin: boolean;
}) {
  const [agents, setAgents] = useState(initialAgents);
  const [deals, setDeals] = useState(initialDeals);
  const [messages, setMessages] = useState(initialMessages);
  const [history, setHistory] = useState(initialHistory);
  const [selectedId, setSelectedId] = useState(initialDeals[0]?.id ?? '');
  const [modalOpen, setModalOpen] = useState(false);
  const [disposedDeals, setDisposedDeals] = useState<Record<string, { kind: 'archived' | 'discarded'; reason: string }>>({});
  const [discardReason, setDiscardReason] = useState<(typeof discardReasons)[number]>(discardReasons[0]);
  const documentsByDeal = useMemo<Record<string, Array<{ id: string; name: string; mimeType: string; createdAt: string }>>>(
    () => ({
      'deal-1': [
        { id: 'doc-1', name: 'diagnostico-comercial.pdf', mimeType: 'application/pdf', createdAt: new Date(Date.now() - 86_400_000).toISOString() },
      ],
      'deal-2': [
        { id: 'doc-2', name: 'proposta-beta-tech.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', createdAt: new Date(Date.now() - 172_800_000).toISOString() },
      ],
      'deal-4': [
        { id: 'doc-3', name: 'contrato-minuta.pdf', mimeType: 'application/pdf', createdAt: new Date(Date.now() - 43_200_000).toISOString() },
      ],
    }),
    [],
  );

  const activeDeals = useMemo(() => deals.filter((deal) => !disposedDeals[deal.id]), [deals, disposedDeals]);
  const selectedDeal = activeDeals.find((deal) => deal.id === selectedId) ?? activeDeals[0];

  const totalValue = useMemo(() => activeDeals.reduce((sum, deal) => sum + deal.valueCents, 0), [activeDeals]);

  const stageCounts = useMemo(() => {
    const counts: Record<ClickStage, number> = { contato_inicial: 0, descoberta: 0, proposta: 0, negociacao: 0, fechamento: 0 };
    for (const deal of activeDeals) counts[deal.stage]++;
    return counts;
  }, [activeDeals]);

  const incomingSqlDeals = useMemo(
    () =>
      activeDeals
        .filter((deal) => deal.source === 'fbr_leads' && deal.stage === 'contato_inicial')
        .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)),
    [activeDeals],
  );

  const stalledDeals = useMemo(
    () =>
      activeDeals
        .filter((deal) => deal.stage !== 'fechamento' && Date.now() - Date.parse(deal.updatedAt) > 1000 * 60 * 60 * 24 * 3)
        .sort((a, b) => Date.parse(a.updatedAt) - Date.parse(b.updatedAt)),
    [activeDeals],
  );

  const closingDeals = useMemo(
    () => activeDeals.filter((deal) => deal.stage === 'fechamento').sort((a, b) => b.score - a.score),
    [activeDeals],
  );

  const workQueue = useMemo(
    () =>
      activeDeals
        .slice()
        .sort((a, b) => {
          const weight = (deal: ClickDeal) => {
            if (deal.stage === 'contato_inicial' && deal.source === 'fbr_leads') return 4;
            if (deal.stage === 'negociacao') return 3;
            if (deal.stage === 'proposta') return 2;
            return 1;
          };

          return weight(b) - weight(a) || b.score - a.score;
        })
        .slice(0, 5),
    [activeDeals],
  );

  async function moveDeal(dealId: string, stage: ClickStage) {
    const currentDeal = deals.find((deal) => deal.id === dealId);
    if (!currentDeal || currentDeal.stage === stage) return;

    const payload = await requestJson<{ deal: ClickDeal }>(`/api/proxy/click/deals/${dealId}/stage`, {
      body: JSON.stringify({ stage }),
      method: 'PATCH',
    });

    setDeals((current) =>
      current.map((deal) => (deal.id === dealId ? payload.deal : deal)),
    );
    setHistory((current) => [
      ...current,
      {
        id: `history-ui-${current.length + 1}`,
        workspaceId: payload.deal.workspaceId,
        dealId,
        type: 'stage_changed',
        actorId: payload.deal.userId,
        actorType: 'human',
        description: `Estagio alterado de ${currentDeal.stage} para ${stage}.`,
        createdAt: new Date().toISOString(),
      },
    ]);
  }

  async function createDeal(input: z.infer<typeof createDealSchema>) {
    const payload = await requestJson<{ deal: ClickDeal }>('/api/proxy/click/deals', {
      body: JSON.stringify(input),
      method: 'POST',
    });

    setDeals((current) => [...current, payload.deal]);
    setSelectedId(payload.deal.id);
    setHistory((current) => [
      ...current,
      {
        id: `history-ui-${current.length + 1}`,
        workspaceId: payload.deal.workspaceId,
        dealId: payload.deal.id,
        type: 'created',
        actorId: payload.deal.userId,
        actorType: 'human',
        description: 'Deal manual criado.',
        createdAt: payload.deal.createdAt,
      },
    ]);
    return payload.deal;
  }

  function appendHistoryEntry(dealId: string, description: string, actorType: 'human' | 'agent' | 'system' = 'human') {
    setHistory((current) => [
      ...current,
      {
        id: `history-ui-${current.length + 1}`,
        workspaceId: selectedDeal?.workspaceId ?? companyId,
        dealId,
        type: 'stage_changed',
        actorId: actorType === 'human' ? selectedDeal?.userId ?? 'operator-1' : 'system',
        actorType,
        description,
        createdAt: new Date().toISOString(),
      },
    ]);
  }

  function focusDeal(dealId: string) {
    setSelectedId(dealId);
  }

  function archiveDeal() {
    if (!selectedDeal) return;

    setDisposedDeals((current) => ({
      ...current,
      [selectedDeal.id]: { kind: 'archived', reason: 'Primeiro negocio pronto para handoff ao FBR-Sales' },
    }));
    appendHistoryEntry(selectedDeal.id, 'Deal arquivado como ganho e sinalizado para handoff ao FBR-Sales.', 'system');
  }

  function discardDeal() {
    if (!selectedDeal) return;

    setDisposedDeals((current) => ({
      ...current,
      [selectedDeal.id]: { kind: 'discarded', reason: discardReason },
    }));
    appendHistoryEntry(selectedDeal.id, `Deal descartado com motivo: ${discardReason}.`);
  }

  async function sendMessage(dealId: string, body: string) {
    const payload = await requestJson<{ message: ClickMessage }>(`/api/proxy/click/deals/${dealId}/messages`, {
      body: JSON.stringify({
        actorType: body.includes('@') ? 'agent' : 'human',
        body,
      }),
      method: 'POST',
    });
    setMessages((current) => [...current, payload.message]);
    setHistory((current) => [
      ...current,
      {
        id: `history-ui-${current.length + 1}`,
        workspaceId: payload.message.workspaceId,
        dealId,
        type: 'message_sent',
        actorId: payload.message.authorId,
        actorType: payload.message.actorType,
        description: 'Mensagem registrada no deal.',
        createdAt: payload.message.createdAt,
      },
    ]);
  }

  async function handleAgentPausedChange(agent: ClickAgent, paused: boolean) {
    const payload = await requestJson<{ agent: ClickAgent }>(`/api/proxy/click/agents/${agent.id}`, {
      body: JSON.stringify({ paused }),
      method: 'PATCH',
    });
    setAgents((current) => current.map((item) => (item.id === payload.agent.id ? payload.agent : item)));
  }

  return (
    <main className="click-shell fbr-shared-theme">
      <nav className="click-breadcrumb">
        <Link href="/">Portal</Link>
        <span>/</span>
        <span>Click</span>
      </nav>

      <section className="click-hero click-hero--compact">
        <div className="click-hero__copy">
          <p>FBR-Click</p>
          <h1>Operacao comercial clara, do SQL ao handoff</h1>
          <span>O trabalho comeca por duas entradas: SQL do FBR-Leads ou deal manual. Depois o time atua no pipeline, registra mensagens, tarefas, documentos e fecha o handoff para FBR-Sales.</span>
        </div>
        <div className="click-hero__actions">
          <button onClick={() => setModalOpen(true)} type="button">
            Criar deal manual
          </button>
          <button disabled={!incomingSqlDeals[0]} onClick={() => incomingSqlDeals[0] && focusDeal(incomingSqlDeals[0].id)} type="button">
            Abrir proximo SQL
          </button>
        </div>
      </section>

      <section className="click-entry-grid" aria-label="Entradas de fluxo Click">
        <article className="click-entry-card">
          <span>Entrada automatica</span>
          <strong>{incomingSqlDeals.length} SQLs aguardando primeiro contato</strong>
          <p>Deals vindos de `lead.qualified` entram em `contato_inicial` e devem acionar o Comercial Bot.</p>
          <button disabled={!incomingSqlDeals[0]} onClick={() => incomingSqlDeals[0] && focusDeal(incomingSqlDeals[0].id)} type="button">
            Assumir proximo SQL
          </button>
        </article>
        <article className="click-entry-card">
          <span>Entrada manual</span>
          <strong>Criar oportunidade fora do Leads</strong>
          <p>Quando o comercial recebe um prospect por outro canal, o fluxo comeca aqui com cadastro manual.</p>
          <button onClick={() => setModalOpen(true)} type="button">
            Novo deal manual
          </button>
        </article>
        <article className="click-entry-card">
          <span>Fila de follow-up</span>
          <strong>{stalledDeals.length} deals parados pedindo retomada</strong>
          <p>Follow-up Bot e operador humano atuam juntos quando o deal fica parado por mais de 3 dias.</p>
          <button disabled={!stalledDeals[0]} onClick={() => stalledDeals[0] && focusDeal(stalledDeals[0].id)} type="button">
            Revisar deal parado
          </button>
        </article>
      </section>

      <section className="click-kpis" aria-label="KPIs Click">
        {initialKpis.map((kpi) => (
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
            <small>{stageLabels[stage]}</small>
          </div>
        ))}
      </section>

      <section className="click-operations-grid">
        <article className="click-queue-card" aria-label="Fila priorizada de trabalho">
          <header>
            <div>
              <p>Fila priorizada</p>
              <h2>Por onde o operador deve comecar</h2>
            </div>
          </header>
          <div className="click-queue-list">
            {workQueue.map((deal) => (
              <button className="click-queue-item" key={deal.id} onClick={() => focusDeal(deal.id)} type="button">
                <strong>{deal.companyName}</strong>
                <span>{stageLabels[deal.stage]} · score {deal.score} · {deal.source === 'fbr_leads' ? 'FBR-Leads' : 'Manual'}</span>
              </button>
            ))}
          </div>
        </article>

        <article className="click-queue-card" aria-label="Fluxo atual selecionado">
          <header>
            <div>
              <p>Deal em foco</p>
              <h2>{selectedDeal ? selectedDeal.companyName : 'Nenhum deal ativo'}</h2>
            </div>
          </header>
          {selectedDeal ? (
            <div className="click-focus-summary">
              <p>
                <strong>Entrada:</strong> {selectedDeal.source === 'fbr_leads' ? 'SQL recebido do FBR-Leads' : 'Criacao manual pelo operador'}
              </p>
              <p>
                <strong>Etapa atual:</strong> {stageLabels[selectedDeal.stage]}
              </p>
              <p>
                <strong>Proximo passo:</strong>{' '}
                {selectedDeal.stage === 'contato_inicial'
                  ? 'executar primeiro contato e registrar mensagem'
                  : selectedDeal.stage === 'descoberta'
                    ? 'conduzir discovery e atualizar tarefas'
                    : selectedDeal.stage === 'proposta'
                      ? 'anexar proposta e negociar ajuste'
                      : selectedDeal.stage === 'negociacao'
                        ? 'remover bloqueios e preparar fechamento'
                        : 'arquivar como ganho e disparar handoff'}
              </p>
            </div>
          ) : (
            <p className="click-empty-state">Todos os deals ativos ja foram encerrados.</p>
          )}
        </article>

        <article className="click-queue-card" aria-label="Fechamentos prontos para handoff">
          <header>
            <div>
              <p>Saida do fluxo</p>
              <h2>Deals prontos para handoff</h2>
            </div>
          </header>
          <div className="click-queue-list">
            {closingDeals.length ? (
              closingDeals.map((deal) => (
                <button className="click-queue-item" key={deal.id} onClick={() => focusDeal(deal.id)} type="button">
                  <strong>{deal.companyName}</strong>
                  <span>Fechamento · score {deal.score} · Handoff Bot / FBR-Sales</span>
                </button>
              ))
            ) : (
              <p className="click-empty-state">Nenhum deal em fechamento neste momento.</p>
            )}
          </div>
        </article>
      </section>

      <section className="click-workspace-grid">
        <div className="click-workspace-main">
          <PipelineBoard deals={activeDeals} onMove={moveDeal} onOpen={(deal) => setSelectedId(deal.id)} />
        </div>
        <div className="click-workspace-side">
          {selectedDeal && (
            <section className="click-action-card" aria-label="Acoes do fluxo">
              <header>
                <div>
                  <p>Fluxo operacional</p>
                  <h2>O que fazer agora</h2>
                </div>
              </header>
              <div className="click-action-card__body">
                <button onClick={() => sendMessage(selectedDeal.id, '@sdr iniciar primeiro contato')} type="button">
                  Registrar acao do Comercial Bot
                </button>
                <button onClick={() => setSelectedId(selectedDeal.id)} type="button">
                  Abrir ficha completa
                </button>
                <div className="click-disposition">
                  <label>
                    Motivo de descarte
                    <select value={discardReason} onChange={(event) => setDiscardReason(event.target.value as (typeof discardReasons)[number])}>
                      {discardReasons.map((reason) => (
                        <option key={reason} value={reason}>
                          {reason}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="click-disposition__actions">
                    <button onClick={discardDeal} type="button">
                      Descartar deal
                    </button>
                    <button disabled={selectedDeal.stage !== 'fechamento'} onClick={archiveDeal} type="button">
                      Arquivar e handoff
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {selectedDeal && (
            <DealDetail
              deal={selectedDeal}
              documents={documentsByDeal[selectedDeal.id] ?? []}
              history={history}
              messages={messages}
              onMessage={sendMessage}
              onMove={moveDeal}
              tasks={initialTasks}
              {...(disposedDeals[selectedDeal.id]
                ? {
                    dispositionLabel: `${disposedDeals[selectedDeal.id]!.kind === 'archived' ? 'Arquivado' : 'Descartado'} · ${disposedDeals[selectedDeal.id]!.reason}`,
                  }
                : {})}
            />
          )}
        </div>
      </section>

      <AgentDashboard agents={agents} companyId={companyId} isAdmin={isAdmin} onAgentPausedChange={handleAgentPausedChange} />

      <details className="click-secondary-panels">
        <summary>Ver superfícies secundarias do modulo</summary>
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
      </details>

      <CreateDealModal open={modalOpen} onClose={() => setModalOpen(false)} onCreate={createDeal} />
    </main>
  );
}
