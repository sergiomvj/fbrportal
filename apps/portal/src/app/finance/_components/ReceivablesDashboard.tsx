'use client';

import { useMemo, useState } from 'react';
import { z } from 'zod';
import { ReceivableSchema } from '@/lib/finance/types';
import type { DashboardKpis, FinanceStatus, Receivable } from '@/lib/finance/types';

const receivableFormSchema = ReceivableSchema.pick({
  partner_name: true,
  amount: true,
  currency: true,
  expected_date: true,
}).extend({
  amount: z.coerce.number().positive('Informe um valor positivo.'),
});

type ReceivableForm = z.infer<typeof receivableFormSchema>;
type SortKey = 'partner_name' | 'amount' | 'expected_date' | 'status';

const statusLabels: Record<FinanceStatus, string> = {
  pendente: 'Pendente',
  recebido: 'Recebido',
  atrasado: 'Atrasado',
  divergente: 'Divergente',
};

const initialForm: ReceivableForm = {
  partner_name: '',
  amount: 0,
  currency: 'BRL',
  expected_date: '',
};

export function ReceivablesDashboard({
  initialKpis,
  initialReceivables,
}: {
  initialKpis: DashboardKpis;
  initialReceivables: Receivable[];
}) {
  const [receivables, setReceivables] = useState(initialReceivables);
  const [partnerQuery, setPartnerQuery] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<FinanceStatus[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('expected_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const visibleReceivables = useMemo(() => {
    const query = partnerQuery.toLowerCase();
    return receivables
      .filter((receivable) => {
        if (query && !receivable.partner_name.toLowerCase().includes(query)) return false;
        if (selectedStatuses.length > 0 && !selectedStatuses.includes(receivable.status)) return false;
        if (startDate && receivable.expected_date < startDate) return false;
        if (endDate && receivable.expected_date > endDate) return false;
        return true;
      })
      .sort((left, right) => {
        const direction = sortDirection === 'asc' ? 1 : -1;
        return left[sortKey] > right[sortKey] ? direction : left[sortKey] < right[sortKey] ? -direction : 0;
      });
  }, [endDate, partnerQuery, receivables, selectedStatuses, sortDirection, sortKey, startDate]);

  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(visibleReceivables.length / pageSize));
  const pageItems = visibleReceivables.slice((page - 1) * pageSize, page * pageSize);

  function retry() {
    setLoading(true);
    setFailed(false);
    window.setTimeout(() => setLoading(false), 120);
  }

  function toggleStatus(status: FinanceStatus) {
    setPage(1);
    setSelectedStatuses((current) => (current.includes(status) ? current.filter((item) => item !== status) : [...current, status]));
  }

  function toggleSort(key: SortKey) {
    setSortKey(key);
    setSortDirection((current) => (sortKey === key && current === 'asc' ? 'desc' : 'asc'));
  }

  function createReceivable(input: ReceivableForm) {
    setReceivables((current) => [
      {
        id: `ui-${current.length + 1}`,
        company_id: initialReceivables[0]?.company_id ?? '11111111-1111-4111-8111-111111111111',
        partner_name: input.partner_name,
        amount: input.amount,
        currency: input.currency,
        expected_date: input.expected_date,
        status: 'pendente',
        created_at: new Date().toISOString(),
      },
      ...current,
    ]);
    setModalOpen(false);
  }

  return (
    <main className="finance-shell fbr-shared-theme fbr-accent-finance">
      <section className="finance-hero finance-hero--compact">
        <div>
          <p>FBR-Finance</p>
          <h1>Recebimentos</h1>
          <span>KPIs, filtros e entrada de recebiveis preparados para conciliacao.</span>
        </div>
        <button onClick={() => setModalOpen(true)} type="button">Novo recebimento</button>
      </section>

      <section aria-label="KPIs de recebimentos" className="finance-kpis">
        <KpiCard label="Receita total" value={formatCurrency(initialKpis.receita_total)} delta={initialKpis.delta_percentual} />
        <KpiCard label="A receber" value={formatCurrency(initialKpis.a_receber)} />
        <KpiCard label="Atrasados" value={String(initialKpis.atrasados)} trend="attention" />
        <KpiCard label="Projecao 30d" value={formatCurrency(initialKpis.projecao_30d ?? 0)} />
      </section>

      <section className="finance-section" aria-label="Tabela de recebimentos">
        <header>
          <div>
            <p>Recebiveis</p>
            <h2>Entrada e acompanhamento</h2>
          </div>
          <button onClick={retry} type="button">{loading ? 'Carregando...' : 'Recarregar'}</button>
        </header>

        <div className="finance-filters">
          <label>
            Parceiro
            <input
              aria-label="Buscar parceiro"
              onChange={(event) => {
                setPage(1);
                setPartnerQuery(event.target.value);
              }}
              placeholder="Buscar parceiro"
              value={partnerQuery}
            />
          </label>
          <label>
            Inicio
            <input aria-label="Data inicial" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          </label>
          <label>
            Fim
            <input aria-label="Data final" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          </label>
          <div aria-label="Status dos recebimentos" className="finance-status-filter">
            {(Object.keys(statusLabels) as FinanceStatus[]).map((status) => (
              <button
                aria-pressed={selectedStatuses.includes(status)}
                key={status}
                onClick={() => toggleStatus(status)}
                type="button"
              >
                {statusLabels[status]}
              </button>
            ))}
          </div>
        </div>

        {failed && (
          <p role="alert">
            Falha ao carregar recebimentos. <button onClick={retry} type="button">Tentar novamente</button>
          </p>
        )}

        <div className="finance-table-wrap">
          <table className="finance-table">
            <thead>
              <tr>
                <th scope="col"><button onClick={() => toggleSort('partner_name')} type="button">Parceiro</button></th>
                <th scope="col"><button onClick={() => toggleSort('amount')} type="button">Valor</button></th>
                <th scope="col"><button onClick={() => toggleSort('expected_date')} type="button">Vencimento</button></th>
                <th scope="col"><button onClick={() => toggleSort('status')} type="button">Status</button></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={4}>Carregando recebimentos...</td></tr>
              )}
              {!loading && pageItems.length === 0 && (
                <tr><td colSpan={4}>Nenhum recebimento encontrado.</td></tr>
              )}
              {!loading && pageItems.map((receivable) => (
                <tr key={receivable.id}>
                  <th scope="row">{receivable.partner_name}</th>
                  <td>{formatCurrency(receivable.amount)}</td>
                  <td>{receivable.expected_date}</td>
                  <td><span className={`finance-badge finance-badge--${receivable.status}`}>{statusLabels[receivable.status]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="finance-pagination">
          <button disabled={page === 1} onClick={() => setPage((current) => current - 1)} type="button">Anterior</button>
          <span>Pagina {page} de {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage((current) => current + 1)} type="button">Proxima</button>
        </footer>
      </section>

      <ReceivableModal open={modalOpen} onClose={() => setModalOpen(false)} onCreate={createReceivable} />
    </main>
  );
}

function KpiCard({ delta, label, trend, value }: { delta?: number; label: string; trend?: 'attention'; value: string }) {
  return (
    <article>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{delta === undefined ? (trend === 'attention' ? 'requer acompanhamento' : 'periodo atual') : `${delta >= 0 ? '+' : ''}${delta}% vs periodo anterior`}</small>
    </article>
  );
}

function ReceivableModal({
  onClose,
  onCreate,
  open,
}: {
  onClose: () => void;
  onCreate: (input: ReceivableForm) => void;
  open: boolean;
}) {
  const [form, setForm] = useState<ReceivableForm>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!open) return null;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = receivableFormSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message])));
      return;
    }
    onCreate(parsed.data);
    setForm(initialForm);
    setErrors({});
  }

  return (
    <div className="finance-modal-backdrop" onMouseDown={onClose}>
      <form className="finance-modal" onMouseDown={(event) => event.stopPropagation()} onSubmit={submit}>
        <header>
          <h2>Novo recebimento</h2>
          <button aria-label="Fechar modal" onClick={onClose} type="button">x</button>
        </header>
        <label>
          Parceiro
          <input value={form.partner_name} onChange={(event) => setForm((current) => ({ ...current, partner_name: event.target.value }))} />
          {errors.partner_name && <span>{errors.partner_name}</span>}
        </label>
        <label>
          Valor
          <input min={0} type="number" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: Number(event.target.value) }))} />
          {errors.amount && <span>{errors.amount}</span>}
        </label>
        <label>
          Vencimento
          <input type="date" value={form.expected_date} onChange={(event) => setForm((current) => ({ ...current, expected_date: event.target.value }))} />
          {errors.expected_date && <span>{errors.expected_date}</span>}
        </label>
        <button type="submit">Criar recebimento</button>
      </form>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { currency: 'BRL', style: 'currency' }).format(value);
}
