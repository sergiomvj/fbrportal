'use client';

import { useState } from 'react';
import type { CostCenterNode } from '@/lib/finance/types';

export function CostCenterTree({ initialCostCenters }: { initialCostCenters: CostCenterNode[] }) {
  return (
    <main className="finance-shell fbr-shared-theme fbr-accent-finance">
      <section className="finance-hero finance-hero--compact">
        <div>
          <p>FBR-Finance</p>
          <h1>Centros de Custo</h1>
          <span>Estrutura hierarquica de centros de custo e gastos do mes.</span>
        </div>
      </section>

      <section className="finance-section" aria-label="Arvore de centros de custo">
        <header>
          <div>
            <p>Centros de Custo</p>
            <h2>Estrutura hierarquica</h2>
          </div>
        </header>

        <div className="cost-center-tree">
          {initialCostCenters.length === 0 && (
            <p>Nenhum centro de custo encontrado.</p>
          )}
          {initialCostCenters.map((node) => (
            <CostCenterNodeComponent key={node.id} node={node} depth={0} />
          ))}
        </div>
      </section>
    </main>
  );
}

function CostCenterNodeComponent({ node, depth }: { node: CostCenterNode; depth: number }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;

  return (
    <div className="cost-center-node" style={{ marginLeft: `${depth * 24}px` }}>
      <div className="cost-center-node-header">
        {hasChildren && (
          <button
            aria-label={expanded ? 'Recolher' : 'Expandir'}
            onClick={() => setExpanded(!expanded)}
            type="button"
            className="cost-center-toggle"
          >
            {expanded ? '▼' : '▶'}
          </button>
        )}
        {!hasChildren && <span className="cost-center-spacer" />}
        <span className="cost-center-name">{node.nome}</span>
        {node.descricao && <span className="cost-center-desc">{node.descricao}</span>}
        <span className="cost-center-amount">{formatCurrency(node.gasto_mes)}</span>
      </div>
      {expanded && hasChildren && (
        <div className="cost-center-children">
          {node.children.map((child) => (
            <CostCenterNodeComponent key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { currency: 'BRL', style: 'currency' }).format(value);
}
