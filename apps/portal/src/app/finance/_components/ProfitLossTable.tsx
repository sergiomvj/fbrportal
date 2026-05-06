'use client';

import type { ProfitLoss } from '@/lib/finance/types';

export function ProfitLossTable({ initialPL }: { initialPL: ProfitLoss }) {
  return (
    <main className="finance-shell fbr-shared-theme fbr-accent-finance">
      <section className="finance-hero finance-hero--compact">
        <div>
          <p>FBR-Finance</p>
          <h1>Demonstracao do Resultado</h1>
          <span>Receitas, despesas e lucro dos ultimos 6 meses.</span>
        </div>
      </section>

      <section className="finance-section" aria-label="P&L">
        <header>
          <div>
            <p>P&L</p>
            <h2>Resultado do periodo</h2>
          </div>
        </header>

        <div className="pl-summary">
          <div className="pl-kpi">
            <span>Receita Total</span>
            <strong>{formatCurrency(initialPL.receita)}</strong>
          </div>
          <div className="pl-kpi">
            <span>Despesas Totais</span>
            <strong>{formatCurrency(initialPL.despesas)}</strong>
          </div>
          <div className="pl-kpi pl-kpi--profit">
            <span>Lucro</span>
            <strong>{formatCurrency(initialPL.lucro)}</strong>
          </div>
          {initialPL.variacao_orcamento !== undefined && (
            <div className="pl-kpi">
              <span>Variacao Orcamento</span>
              <strong>{initialPL.variacao_orcamento}%</strong>
            </div>
          )}
        </div>

        <div className="finance-table-wrap">
          <table className="finance-table">
            <thead>
              <tr>
                <th scope="col">Mes</th>
                <th scope="col">Receita</th>
                <th scope="col">Despesas</th>
                <th scope="col">Lucro</th>
              </tr>
            </thead>
            <tbody>
              {initialPL.historico_6m.length === 0 && (
                <tr><td colSpan={4}>Nenhum historico encontrado.</td></tr>
              )}
              {initialPL.historico_6m.map((item) => (
                <tr key={item.mes}>
                  <th scope="row">{formatMonth(item.mes)}</th>
                  <td>{formatCurrency(item.receita)}</td>
                  <td>{formatCurrency(item.despesas)}</td>
                  <td className={item.lucro >= 0 ? 'pl-positive' : 'pl-negative'}>
                    {formatCurrency(item.lucro)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { currency: 'BRL', style: 'currency' }).format(value);
}

function formatMonth(month: string) {
  const [year, monthNum] = month.split('-');
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${monthNames[Number(monthNum) - 1]} ${year}`;
}
