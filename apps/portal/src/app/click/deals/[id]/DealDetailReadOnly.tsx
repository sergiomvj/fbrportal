'use client';

import type { ClickDeal, ClickDealHistory, ClickMessage, ClickTask } from '@/lib/click/types';
import { DealDetail } from '../../_components/DealDetail';

export function DealDetailReadOnly({
  deal,
  history,
  messages,
  tasks,
  documents = [],
}: {
  deal: ClickDeal;
  history: ClickDealHistory[];
  messages: ClickMessage[];
  tasks: ClickTask[];
  documents?: Array<{ id: string; name: string; mimeType: string; createdAt: string }>;
}) {
  return (
    <DealDetail
      deal={deal}
      documents={documents}
      history={history}
      messages={messages}
      onMessage={() => undefined}
      onMove={() => undefined}
      tasks={tasks}
    />
  );
}
