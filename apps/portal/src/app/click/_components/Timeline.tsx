import type { ClickDealHistory } from '@/lib/click/types';
import { formatDate } from './format';

const icons: Record<ClickDealHistory['type'], string> = {
  agent_triggered: 'AI',
  created: '+',
  message_sent: 'MSG',
  stage_changed: 'ET',
  task_updated: 'OK',
};

export function Timeline({ events }: { events: ClickDealHistory[] }) {
  return (
    <section className="click-timeline" aria-label="Timeline auditavel">
      {events.map((event) => (
        <article key={event.id}>
          <span aria-hidden="true">{icons[event.type]}</span>
          <div>
            <strong>{event.description}</strong>
            <p>
              {event.actorType} - {formatDate(event.createdAt)}
            </p>
          </div>
        </article>
      ))}
    </section>
  );
}

