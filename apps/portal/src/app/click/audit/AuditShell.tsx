'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { ClickDealHistory } from '@/lib/click/types';

const typeLabels: Record<string, string> = {
  created: 'Criado',
  stage_changed: 'Estagio alterado',
  message_sent: 'Mensagem',
  task_updated: 'Tarefa',
  agent_triggered: 'Agente acionado',
};

export function AuditShell({ history }: { history: ClickDealHistory[] }) {
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let items = history;
    if (filter !== 'all') items = items.filter((item) => item.type === filter);
    if (search) {
      const lower = search.toLowerCase();
      items = items.filter(
        (item) =>
          item.description.toLowerCase().includes(lower) ||
          item.dealId.toLowerCase().includes(lower),
      );
    }
    return items;
  }, [history, filter, search]);

  return (
    <main className="click-shell fbr-shared-theme">
      <nav className="click-breadcrumb">
        <Link href="/">Portal</Link>
        <span>/</span>
        <Link href="/click">Click</Link>
        <span>/</span>
        <span>Audit Log</span>
      </nav>

      <section className="click-hero">
        <div className="click-hero__copy">
          <p>FBR-Click</p>
          <h1>Audit Log</h1>
          <span>Registro imutavel e append-only de todas as acoes no pipeline.</span>
        </div>
      </section>

      <section className="click-audit-filters" aria-label="Filtros do audit">
        <input
          placeholder="Buscar por descricao ou deal ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">Todos os tipos</option>
          {Object.entries(typeLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </section>

      <section className="click-audit-table" aria-label="Tabela de audit">
        <table>
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Deal</th>
              <th>Descricao</th>
              <th>Ator</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry) => (
              <tr key={entry.id}>
                <td>
                  <span className={`click-audit-type click-audit-type--${entry.type}`}>
                    {typeLabels[entry.type] ?? entry.type}
                  </span>
                </td>
                <td>
                  <Link href={`/click/deals/${entry.dealId}`}>{entry.dealId}</Link>
                </td>
                <td>{entry.description}</td>
                <td>
                  <span className={`click-audit-actor click-audit-actor--${entry.actorType}`}>
                    {entry.actorType === 'agent' ? 'Agente' : entry.actorType === 'system' ? 'Sistema' : 'Humano'}
                  </span>
                </td>
                <td>{new Date(entry.createdAt).toLocaleString('pt-BR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <small>{filtered.length} registros</small>
      </section>
    </main>
  );
}
