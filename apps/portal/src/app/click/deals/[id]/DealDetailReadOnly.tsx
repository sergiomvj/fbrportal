'use client';

import type { ClickDeal, ClickDealHistory, ClickMessage, ClickTask } from '@/lib/click/types';
import { DealDetail } from '../../_components/DealDetail';

export function DealDetailReadOnly({
  deal,
  history,
  messages,
  tasks,
}: {
  deal: ClickDeal;
  history: ClickDealHistory[];
  messages: ClickMessage[];
  tasks: ClickTask[];
}) {
  return (
    <DealDetail
      deal={deal}
      history={history}
      messages={messages}
      onMessage={() => undefined}
      onMove={() => undefined}
      tasks={tasks}
    />
  );
}

