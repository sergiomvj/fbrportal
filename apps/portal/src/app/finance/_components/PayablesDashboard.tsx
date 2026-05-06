'use client';

import { useMemo, useState } from 'react';
import { z } from 'zod';
import { PayableSchema } from '@/lib/finance/types';
import type { Payable, PayableStatus } from '@/lib/finance/types';

const payableFormSchema = PayableSchema.pick({
  fornecedor_nome: true,
  descricao: true,
  amount: true,
  data_vencimento: true,
  recorrente: true,
}).extend({
  amount: z.coerce.number().positive('Informe um valor positivo.'),
});

type PayableForm = z.infer<typeof payableFormSchema>;
type SortKey = 'fornecedor_nome' | 'amount' | 'data_vencimento' | 'status';

const statusLabels: Record<PayableStatus, string> = {
  pendente: 'Pendente',
  aprovado: 'Aprovado',
  pago: 'Pago',
  rejeitado: 'Rejeitado',
  cancelado: 'Cancelado',
};

const initialForm: PayableForm = {
  fornecedor_nome: '',
  descricao: '',
  amount: 0,
  data_vencimento: '',
  recorrente: false,
};

export function PayablesDashboard({ initialPayables }: { initialPayables: Payable[] }) {
  const [payables, setPayables] = useState(initialPayables);
  const [fornecedorQuery, setFornecedorQuery] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<PayableStatus[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('data_vencimento');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const visiblePayables = useMemo(() => {
    const query = fornecedorQuery.toLowerCase();
    return payables
      .filter((payable) => {
        if (query && !payable.fornecedor_nome.toLowerCase().includes(query)) return false;
        if (selectedStatuses.length > 0 && !selectedStatuses.includes(payable.status)) return false;
        if (startDate && payable.data_vencimento < startDate) return false;
        if (endDate && payable.data_vencimento > endDate) return false;
        return true;
      })
      .sort((left, right) => {
        const direction = sortDirection === 'asc' ? 1 : -1;
        return left[sortKey] > right[sortKey] ? direction : left[sortKey] < right[sortKey] ? -direction : 0;
      });
  }, [endDate, fornecedorQuery, payables, selectedStatuses, sortDirection, sortKey, startDate]);

  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(visiblePayables.length / pageSize));
  const pageItems = visiblePayables.slice((page - 1) * pageSize, page * pageSize);

  function toggleStatus(status: PayableStatus) {
    setPage(1);
    setSelectedStatuses((current) => (current.includes(status) ? current.filter((item) => item !== status) : [...current, status]));
  }

  function toggleSort(key: SortKey) {
    setSortKey(key);
    setSortDirection((current) => (sortKey === key && current === 'asc' ? 'desc' : 'asc'));
  }

  function createPayable(input: PayableForm) {
    setPayables((current) => [
      {
        id: `ui-${current.length + 1}`,
        company_id: '11111111-1111-4111-8111-111111111111',
        fornecedor_nome: input.fornecedor_nome,
        descricao: input.descricao,
        amount: input.amount,
        currency: 'BRL',
        data_vencimento: input.data_vencimento,
        status: 'pendente',
        recorrente: input.recorrente,
        created_at: new Date().toISOString(),
      },
      ...current,
    ]);
    setModalOpen(false);
  }

  function approvePayable(id: string) {
    setPayables((current) =>
      current.map((p) =>
        p.id === id ? { ...p, status: 'aprovado' as const, aprovado_por: 'current-user', aprovado_em: new Date().toISOString() } : p,
      ),
    );
  }

  return (
    <main className="finance-shell fbr-shared-theme fbr-accent-finance">
      <section className="finance-hero finance-hero--compact">
        <div>
          <p>FBR-Finance</p>
          <h1>Pagamentos</h1>
          <span>Gestao de pagamentos, aprovacoes e fornecedores.</span>
        </div>
        <button onClick={() => setModalOpen(true)} type="button">Novo pagamento</button>
      </section>

      <section className="finance-section" aria-label="Tabela de pagamentos">
        <header>
          <div>
            <p>Pagamentos</p>
            <h2>Entrada e acompanhamento</h2>
          </div>
          <button onClick={() => setLoading(!loading)} type="button">{loading ? 'Carregando...' : 'Recarregar'}</button>
        </header>

        <div className="finance-filters">
          <label>
            Fornecedor
            <input
              aria-label="Buscar fornecedor"
              onChange={(event) => {
                setPage(1);
                setFornecedorQuery(event.target.value);
              }}
              placeholder="Buscar fornecedor"
              value={fornecedorQuery}
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
          <div aria-label="Status dos pagamentos" className="finance-status-filter">
            {(Object.keys(statusLabels) as PayableStatus[]).map((status) => (
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

        <div className="finance-table-wrap">
          <table className="finance-table">
            <thead>
              <tr>
                <th scope="col"><button onClick={() => toggleSort('fornecedor_nome')} type="button">Fornecedor</button></th>
                <th scope="col">Descricao</th>
                <th scope="col"><button onClick={() => toggleSort('amount')} type="button">Valor</button></th>
                <th scope="col"><button onClick={() => toggleSort('data_vencimento')} type="button">Vencimento</button></th>
                <th scope="col"><button onClick={() => toggleSort('status')} type="button">Status</button></th>
                <th scope="col">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6}>Carregando pagamentos...</td></tr>
              )}
              {!loading && pageItems.length === 0 && (
                <tr><td colSpan={6}>Nenhum pagamento encontrado.</td></tr>
              )}
              {!loading && pageItems.map((payable) => (
                <tr key={payable.id}>
                  <th scope="row">{payable.fornecedor_nome}</th>
                  <td>{payable.descricao}</td>
                  <td>{formatCurrency(payable.amount)}</td>
                  <td>{payable.data_vencimento}</td>
                  <td>
                    <span className={`finance-badge finance-badge--${payable.status}`}>
                      {statusLabels[payable.status]}
                    </span>
                  </td>
                  <td>
                    {payable.status === 'pendente' && (
                      <button onClick={() => approvePayable(payable.id!)} type="button">Aprovar</button>
                    )}
                    {payable.recorrente && <span title="Recorrente">🔄</span>}
                  </td>
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

      <PayableModal open={modalOpen} onClose={() => setModalOpen(false)} onCreate={createPayable} />
    </main>
  );
}

function PayableModal({
  onClose,
  onCreate,
  open,
}: {
  onClose: () => void;
  onCreate: (input: PayableForm) => void;
  open: boolean;
}) {
  const [form, setForm] = useState<PayableForm>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!open) return null;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = payableFormSchema.safeParse(form);
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
          <h2>Novo pagamento</h2>
          <button aria-label="Fechar modal" onClick={onClose} type="button">x</button>
        </header>
        <label>
          Fornecedor
          <input value={form.fornecedor_nome} onChange={(event) => setForm((current) => ({ ...current, fornecedor_nome: event.target.value }))} />
          {errors.fornecedor_nome && <span>{errors.fornecedor_nome}</span>}
        </label>
        <label>
          Descricao
          <input value={form.descricao} onChange={(event) => setForm((current) => ({ ...current, descricao: event.target.value }))} />
          {errors.descricao && <span>{errors.descricao}</span>}
        </label>
        <label>
          Valor
          <input min={0} type="number" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: Number(event.target.value) }))} />
          {errors.amount && <span>{errors.amount}</span>}
        </label>
        <label>
          Vencimento
          <input type="date" value={form.data_vencimento} onChange={(event) => setForm((current) => ({ ...current, data_vencimento: event.target.value }))} />
          {errors.data_vencimento && <span>{errors.data_vencimento}</span>}
        </label>
        <label>
          <input type="checkbox" checked={form.recorrente} onChange={(event) => setForm((current) => ({ ...current, recorrente: event.target.checked }))} />
          Recorrente
        </label>
        <button type="submit">Criar pagamento</button>
      </form>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { currency: 'BRL', style: 'currency' }).format(value);
}
