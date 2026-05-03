import { clickDeals, clickHistory, clickMessages, clickTasks } from '@/lib/click/fixtures';
import { DealDetailReadOnly } from './DealDetailReadOnly';
import '../../click.css';

export default async function ClickDealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deal = clickDeals.find((item) => item.id === id) ?? clickDeals[0];

  return (
    <main className="click-shell fbr-shared-theme">
      {deal && <DealDetailReadOnly deal={deal} history={clickHistory} messages={clickMessages} tasks={clickTasks} />}
    </main>
  );
}
