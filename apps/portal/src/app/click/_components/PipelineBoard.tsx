'use client';

import type { ClickDeal, ClickStage } from '@/lib/click/types';
import { clickStages } from '@/lib/click/types';
import { DealCard } from './DealCard';

const labels: Record<ClickStage, string> = {
  contato_inicial: 'Contato Inicial',
  descoberta: 'Descoberta',
  proposta: 'Proposta',
  negociacao: 'Negociacao',
  fechamento: 'Fechamento',
};

export function PipelineBoard({
  deals,
  onMove,
  onOpen,
}: {
  deals: ClickDeal[];
  onMove: (dealId: string, stage: ClickStage) => Promise<void> | void;
  onOpen: (deal: ClickDeal) => void;
}) {
  return (
    <section className="click-pipeline" aria-label="Pipeline Click">
      {clickStages.map((stage) => {
        const stageDeals = deals.filter((deal) => deal.stage === stage);

        return (
          <div
            className="click-pipeline__column"
            key={stage}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => void onMove(event.dataTransfer.getData('text/plain'), stage)}
          >
            <header>
              <h3>{labels[stage]}</h3>
              <span>{stageDeals.length}</span>
            </header>
            <div className="click-pipeline__cards">
              {stageDeals.map((deal) => (
                <div draggable key={deal.id} onDragStart={(event) => event.dataTransfer.setData('text/plain', deal.id)}>
                  <DealCard deal={deal} onOpen={onOpen} />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
