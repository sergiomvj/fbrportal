import { getClickPageContext } from '@/lib/click/context';
import { getKpis, listAgents, listAudit, listDeals, listMessages, listTasks } from '@/lib/click/store';
import { ClickWorkspace } from './_components/ClickWorkspace';
import './click.css';

export default async function ClickPage() {
  const context = await getClickPageContext();
  const deals = listDeals(context);

  return (
    <ClickWorkspace
      companyId={context.workspaceId}
      initialAgents={listAgents(context)}
      initialDeals={deals}
      initialHistory={listAudit(context)}
      initialKpis={getKpis(context)}
      initialMessages={deals.flatMap((deal) => listMessages(context, deal.id) ?? [])}
      initialTasks={deals.flatMap((deal) => listTasks(context, deal.id) ?? [])}
      isAdmin={context.role === 'admin'}
    />
  );
}
