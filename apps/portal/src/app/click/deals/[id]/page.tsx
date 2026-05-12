import { getClickPageContext } from '@/lib/click/context';
import { getDeal, listAudit, listDeals, listMessages, listTasks } from '@/lib/click/store';
import { DealDetailReadOnly } from './DealDetailReadOnly';
import '../../click.css';

export default async function ClickDealPage({ params }: { params: Promise<{ id: string }> }) {
  const context = await getClickPageContext();
  const { id } = await params;
  const deal = getDeal(context, id) ?? listDeals(context)[0];

  return (
    <main className="click-shell fbr-shared-theme">
      {deal && (
        <DealDetailReadOnly
          deal={deal}
          history={listAudit(context, deal.id)}
          messages={listMessages(context, deal.id) ?? []}
          tasks={listTasks(context, deal.id) ?? []}
        />
      )}
    </main>
  );
}
