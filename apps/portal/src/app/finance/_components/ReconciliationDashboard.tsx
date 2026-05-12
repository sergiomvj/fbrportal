'use client';

import { useState } from 'react';
import type { ReconciliationItem, ReconciliationJob } from '@/lib/finance/types';

const statusLabels: Record<string, string> = {
  pendente: 'Pendente',
  revisao: 'Em Revisao',
  conciliado: 'Conciliado',
};

const statusColors: Record<string, string> = {
  pendente: 'finance-badge--pendente',
  revisao: 'finance-badge--revisao',
  conciliado: 'finance-badge--recebido',
};

export function ReconciliationDashboard({
  initialPendingItems,
  proxyHeaders,
  companyId,
}: {
  initialPendingItems: ReconciliationItem[];
  proxyHeaders: Record<string, string>;
  companyId: string;
}) {
  const [pendingItems, setPendingItems] = useState(initialPendingItems);
  const [job, setJob] = useState<ReconciliationJob | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ReconciliationItem | null>(null);

  async function refreshPendingItems() {
    const response = await fetch('/api/proxy/finance/conciliacao/pendencias', {
      headers: proxyHeaders,
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.error?.message ?? 'Falha ao carregar pendencias.');
    }
    setPendingItems((payload.data as ReconciliationItem[]) ?? []);
  }

  async function runReconciliation() {
    setLoading(true);
    try {
      const response = await fetch('/api/proxy/finance/conciliacao/run', {
        method: 'POST',
        headers: proxyHeaders,
        body: JSON.stringify({ empresa_id: companyId, extratos: [] }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? 'Falha ao executar conciliacao.');
      }

      setJob({
        id: payload.data.job_id,
        company_id: companyId,
        status: payload.data.status,
        progress: payload.data.status === 'completed' ? 100 : 0,
        total_items: payload.data.total_movimentos,
        processed_items: payload.data.total_movimentos,
        auto_matched: 0,
        pending_review: 0,
        unreconciled: 0,
        created_at: new Date().toISOString(),
      });

      await refreshPendingItems();
    } finally {
      setLoading(false);
    }
  }

  async function approveItem(id: string) {
    const response = await fetch(`/api/proxy/finance/conciliacao/pendencias/${id}/aprovar`, {
      method: 'POST',
      headers: proxyHeaders,
      body: JSON.stringify({ decisao: 'aprovar' }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.error?.message ?? 'Falha ao aprovar conciliacao.');
    }
    setPendingItems((current) => current.filter((item) => item.id !== id));
    setSelectedItem(null);
  }

  async function rejectItem(id: string) {
    const response = await fetch(`/api/proxy/finance/conciliacao/pendencias/${id}/rejeitar`, {
      method: 'POST',
      headers: proxyHeaders,
      body: JSON.stringify({ decisao: 'rejeitar', observacao: 'Rejeitado manualmente pelo portal.' }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.error?.message ?? 'Falha ao rejeitar conciliacao.');
    }
    setPendingItems((current) => current.map((item) => (item.id === id ? (payload.data as ReconciliationItem) : item)));
    setSelectedItem(null);
  }

  async function createEntry(id: string) {
    const response = await fetch(`/api/proxy/finance/conciliacao/pendencias/${id}/criar-lancamento`, {
      method: 'POST',
      headers: proxyHeaders,
      body: JSON.stringify({ decisao: 'criar_lancamento', tipo: 'recebimento', parceiro_fornecedor: 'Manual Entry' }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.error?.message ?? 'Falha ao criar lancamento.');
    }
    setPendingItems((current) => current.filter((item) => item.id !== id));
    setSelectedItem(null);
  }

  function getScoreColor(score: number): string {
    if (score >= 80) return 'score-high';
    if (score >= 50) return 'score-medium';
    return 'score-low';
  }

  function getDetails(item: ReconciliationItem) {
    const details = (item.match_details ?? {}) as {
      extrato?: { valor?: number; data_movimento?: string };
      amount?: number;
      date?: string;
    };
    return {
      amount: details.extrato?.valor ?? details.amount ?? 0,
      date: details.extrato?.data_movimento ?? details.date ?? '-',
    };
  }

  return (
    <main className="finance-shell fbr-shared-theme fbr-accent-finance">
      <section className="finance-hero finance-hero--compact">
        <div>
          <p>FBR-Finance</p>
          <h1>Conciliacao</h1>
          <span>Reconciliacao bancaria automatica com fila de revisao humana.</span>
        </div>
        <button onClick={() => void runReconciliation()} disabled={loading} type="button">
          {loading ? 'Processando...' : 'Executar Conciliacao'}
        </button>
      </section>

      {job && (
        <section className="finance-section" aria-label="Progresso da reconciliacao">
          <header>
            <div>
              <p>Progresso</p>
              <h2>Job: {job.id?.slice(0, 8)}</h2>
            </div>
          </header>

          <div className="reconciliation-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${job.progress}%` }} />
            </div>
            <div className="progress-stats">
              <span>Total: {job.total_items}</span>
              <span>Processados: {job.processed_items}</span>
              <span>Auto-conciliados: {job.auto_matched}</span>
              <span>Revisao: {job.pending_review}</span>
              <span>Nao conciliados: {job.unreconciled}</span>
            </div>
          </div>
        </section>
      )}

      <section className="finance-section" aria-label="Itens pendentes">
        <header>
          <div>
            <p>Pendencias</p>
            <h2>Fila de revisao</h2>
          </div>
        </header>

        {pendingItems.length === 0 ? (
          <p className="empty-state">Nenhum item pendente de revisao.</p>
        ) : (
          <div className="reconciliation-items">
            {pendingItems.map((item) => {
              const details = getDetails(item);
              return (
                <div
                  key={item.id}
                  className={`reconciliation-card ${selectedItem?.id === item.id ? 'selected' : ''}`}
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="reconciliation-card-header">
                    <span className={`score-badge ${getScoreColor(item.score)}`}>
                      {item.score}
                    </span>
                    <span className={`finance-badge ${statusColors[item.status]}`}>
                      {statusLabels[item.status]}
                    </span>
                  </div>
                  <div className="reconciliation-card-details">
                    <span>Valor: {formatCurrency(details.amount)}</span>
                    <span>Data: {details.date}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {selectedItem && (
        <section className="finance-section reconciliation-detail" aria-label="Detalhes do item">
          <header>
            <div>
              <p>Detalhes</p>
              <h2>Item de conciliacao</h2>
            </div>
            <button onClick={() => setSelectedItem(null)} type="button">Fechar</button>
          </header>

          <div className="detail-content">
            <div className="detail-info">
              <span>Score: {selectedItem.score}</span>
              <span>Status: {statusLabels[selectedItem.status]}</span>
              <span>Valor: {formatCurrency(getDetails(selectedItem).amount)}</span>
              <span>Data: {getDetails(selectedItem).date}</span>
            </div>

            <div className="detail-actions">
              {selectedItem.status !== 'conciliado' && (
                <>
                  <button onClick={() => void approveItem(selectedItem.id!)} type="button" className="btn-approve">
                    Aprovar
                  </button>
                  <button onClick={() => void rejectItem(selectedItem.id!)} type="button" className="btn-reject">
                    Rejeitar
                  </button>
                  <button onClick={() => void createEntry(selectedItem.id!)} type="button" className="btn-create">
                    Criar Entrada
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { currency: 'BRL', style: 'currency' }).format(value);
}
