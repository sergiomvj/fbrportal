'use client';

import type { ClickDeal } from '@/lib/click/types';
import { formatCurrency, formatDate } from './format';

export function DealCard({ deal, onOpen }: { deal: ClickDeal; onOpen?: (deal: ClickDeal) => void }) {
  return (
    <button
      className="click-deal-card"
      onClick={() => onOpen?.(deal)}
      title={`Criado em ${formatDate(deal.createdAt)}. Responsavel: ${deal.userId}. Ultimo evento: ${formatDate(deal.updatedAt)}.`}
      type="button"
    >
      <span className="click-deal-card__topline">
        <strong>{deal.companyName}</strong>
        <span className={`click-source click-source--${deal.source}`}>{deal.source === 'fbr_leads' ? 'FBR-Leads' : 'Manual'}</span>
      </span>
      <span className="click-deal-card__contact">{deal.contactName || deal.contactEmail || 'Contato pendente'}</span>
      <span className="click-deal-card__value">{formatCurrency(deal.valueCents)}</span>
      <span className="click-score" aria-label={`Score ${deal.score}`}>
        <span className="click-score__bar" style={{ width: `${deal.score}%` }} />
      </span>
      <span className="click-deal-card__footer">
        <span>{deal.score}/100</span>
        <span>{deal.activeAgentSlot ? `Agente: ${deal.activeAgentSlot}` : 'Sem agente ativo'}</span>
      </span>
    </button>
  );
}

