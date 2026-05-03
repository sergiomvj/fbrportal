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
  onMove,
  onMessage,
}: {
  deal: ClickDeal;
  history: ClickDealHistory[];
  messages: ClickMessage[];
  tasks: ClickTask[];
  onMove: (dealId: string, stage: ClickStage) => void;
  onMessage: (dealId: string, body: string) => void;
}) {
  const [tab, setTab] = useState<'timeline' | 'messages' | 'tasks'>('timeline');

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
      <label className="click-detail__stage">
        Estagio
        <select value={deal.stage} onChange={(event) => onMove(deal.id, event.target.value as ClickStage)}>
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
    </aside>
  );
}

