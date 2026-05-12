'use client';

import { useState } from 'react';
import type { ClickDeal, ClickDealHistory, ClickMessage, ClickStage, ClickTask } from '@/lib/click/types';
import { clickStages } from '@/lib/click/types';
import { formatCurrency, formatDate } from './format';
import { MessagesPanel } from './MessagesPanel';
import { Timeline } from './Timeline';

export function DealDetail({
  deal,
  history,
  messages,
  tasks,
  documents,
  dispositionLabel,
  onMove,
  onMessage,
}: {
  deal: ClickDeal;
  history: ClickDealHistory[];
  messages: ClickMessage[];
  tasks: ClickTask[];
  documents: Array<{ id: string; name: string; mimeType: string; createdAt: string }>;
  dispositionLabel?: string | undefined;
  onMove: (dealId: string, stage: ClickStage) => Promise<void> | void;
  onMessage: (dealId: string, body: string) => Promise<void> | void;
}) {
  const [tab, setTab] = useState<'timeline' | 'messages' | 'tasks' | 'docs'>('timeline');

  return (
    <aside className="click-detail" aria-label="Detalhe do deal">
      <header>
        <p>Deal</p>
        <h2>{deal.title}</h2>
        <strong>{formatCurrency(deal.valueCents)}</strong>
      </header>
      <div className="click-detail__stats">
        <span>Score {deal.score}</span>
        <span>{deal.source}</span>
        <span>{deal.priority}</span>
      </div>
      <dl className="click-detail__meta">
        <div>
          <dt>Empresa</dt>
          <dd>{deal.companyName}</dd>
        </div>
        <div>
          <dt>Contato</dt>
          <dd>{deal.contactName || deal.contactEmail || 'Pendente'}</dd>
        </div>
        <div>
          <dt>Agente atual</dt>
          <dd>{deal.activeAgentSlot || 'Sem agente ativo'}</dd>
        </div>
        <div>
          <dt>Status do fluxo</dt>
          <dd>{dispositionLabel || 'Em andamento'}</dd>
        </div>
      </dl>
      <label className="click-detail__stage">
        Estagio
        <select value={deal.stage} onChange={(event) => void onMove(deal.id, event.target.value as ClickStage)}>
          {clickStages.map((stage) => (
            <option key={stage} value={stage}>
              {stage}
            </option>
          ))}
        </select>
      </label>
      <nav className="click-tabs" aria-label="Abas do deal">
        <button aria-pressed={tab === 'timeline'} onClick={() => setTab('timeline')} type="button">
          Timeline
        </button>
        <button aria-pressed={tab === 'messages'} onClick={() => setTab('messages')} type="button">
          Messages
        </button>
        <button aria-pressed={tab === 'tasks'} onClick={() => setTab('tasks')} type="button">
          Tasks
        </button>
        <button aria-pressed={tab === 'docs'} onClick={() => setTab('docs')} type="button">
          Docs
        </button>
      </nav>
      {tab === 'timeline' && <Timeline events={history.filter((event) => event.dealId === deal.id)} />}
      {tab === 'messages' && (
        <MessagesPanel messages={messages.filter((message) => message.dealId === deal.id)} onSend={(body) => onMessage(deal.id, body)} />
      )}
      {tab === 'tasks' && (
        <div className="click-task-list">
          {tasks
            .filter((task) => task.dealId === deal.id)
            .map((task) => (
              <p key={task.id}>
                <span>{task.status === 'done' ? '[x]' : '[ ]'}</span> {task.title}
              </p>
          ))}
          <small>Atualizado em {formatDate(deal.updatedAt)}</small>
        </div>
      )}
      {tab === 'docs' && (
        <div className="click-doc-list" aria-label="Documentos do deal">
          {documents.length ? (
            documents.map((document) => (
              <article key={document.id}>
                <strong>{document.name}</strong>
                <span>{document.mimeType}</span>
                <small>Upload em {formatDate(document.createdAt)}</small>
              </article>
            ))
          ) : (
            <p>Nenhum documento anexado ainda.</p>
          )}
        </div>
      )}
    </aside>
  );
}
