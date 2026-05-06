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

export function ReconciliationDashboard({ initialPendingItems }: { initialPendingItems: ReconciliationItem[] }) {
  const [pendingItems, setPendingItems] = useState(initialPendingItems);
  const [job, setJob] = useState<ReconciliationJob | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ReconciliationItem | null>(null);

  async function runReconciliation() {
    setLoading(true);
    try {
      const response = await fetch('/api/proxy/finance/conciliacao/run', { method: 'POST' });
      const data = await response.json();
      setJob(data.job);

      const pendingResponse = await fetch('/api/proxy/finance/conciliacao/pendencias');
      const pendingData = await pendingResponse.json();
      setPendingItems(pendingData.pendencias);
    } catch {
      // Error handled silently
    } finally {
      setLoading(false);
    }
  }

  async function approveItem(id: string) {
    try {
      await fetch(`/api/proxy/finance/conciliacao/${id}/approve`, { method: 'POST' });
      setPendingItems((current) => current.filter((item) => item.id !== id));
      setSelectedItem(null);
    } catch {
      // Error handled silently
    }
  }

  async function rejectItem(id: string) {
    try {
      await fetch(`/api/proxy/finance/conciliacao/${id}/reject`, { method: 'POST' });
      setPendingItems((current) => current.map((item) => (item.id === id ? { ...item, status: 'pendente' as const } : item)));
      setSelectedItem(null);
    } catch {
      // Error handled silently
    }
  }

  async function createEntry(id: string) {
    try {
      await fetch(`/api/proxy/finance/conciliacao/${id}/create-entry`, { method: 'POST' });
      setPendingItems((current) => current.filter((item) => item.id !== id));
      setSelectedItem(null);
    } catch {
      // Error handled silently
    }
  }

  function getScoreColor(score: number): string {
    if (score >= 80) return 'score-high';
    if (score >= 50) return 'score-medium';
    return 'score-low';
  }

  return (
    <main className="finance-shell fbr-shared-theme fbr-accent-finance">
      <section className="finance-hero finance-hero--compact">
        <div>
          <p>FBR-Finance</p>
          <h1>Conciliacao</h1>
          <span>Reconciliacao bancaria automatica com fila de revisao humana.</span>
        </div>
        <button onClick={runReconciliation} disabled={loading} type="button">
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
            {pendingItems.map((item) => (
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
                  {item.match_details && typeof item.match_details === 'object' && (
                    <>
                      <span>Valor: {formatCurrency((item.match_details as { amount?: number }).amount ?? 0)}</span>
                      <span>Data: {(item.match_details as { date?: string }).date ?? '-'}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
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
              {selectedItem.match_details && typeof selectedItem.match_details === 'object' && (
                <>
                  <span>Valor: {formatCurrency((selectedItem.match_details as { amount?: number }).amount ?? 0)}</span>
                  <span>Data: {(selectedItem.match_details as { date?: string }).date ?? '-'}</span>
                </>
              )}
            </div>

            <div className="detail-actions">
              {selectedItem.status !== 'conciliado' && (
                <>
                  <button onClick={() => approveItem(selectedItem.id!)} type="button" className="btn-approve">
                    Aprovar
                  </button>
                  <button onClick={() => rejectItem(selectedItem.id!)} type="button" className="btn-reject">
                    Rejeitar
                  </button>
                  <button onClick={() => createEntry(selectedItem.id!)} type="button" className="btn-create">
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
