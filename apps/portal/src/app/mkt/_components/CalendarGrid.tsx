'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { MktCalendarItem } from '@/lib/mkt/types';

export function CalendarGrid() {
  const params = useParams();
  const id = params.id as string;
  const [items, setItems] = useState<MktCalendarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [canalFilter, setCanalFilter] = useState<string>('all');

  useEffect(() => {
    fetch(`/api/proxy/mkt/estrategias/${id}/calendario`)
      .then((r) => r.json())
      .then((d) => setItems(d.calendario ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const canais = [...new Set(items.map((i) => i.canal))];
  const filtered = canalFilter === 'all' ? items : items.filter((i) => i.canal === canalFilter);

  const weeks: MktCalendarItem[][] = [];
  let currentWeek: MktCalendarItem[] = [];

  for (const item of filtered.sort((a, b) => a.data.localeCompare(b.data))) {
    const d = new Date(item.data);
    const day = d.getDay();
    if (day === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(item);
  }
  if (currentWeek.length > 0) weeks.push(currentWeek);

  const handleExportCsv = async () => {
    const res = await fetch(`/api/proxy/mkt/estrategias/${id}/calendario`, {
      method: 'POST',
      
    });
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `calendario_${id}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  if (loading) return <main className="mkt-shell fbr-shared-theme"><p>Carregando calendario...</p></main>;

  return (
    <main className="mkt-shell fbr-shared-theme">
      <nav className="mkt-breadcrumb">
        <Link href="/">Portal</Link><span>/</span>
        <Link href="/mkt">MKT</Link><span>/</span>
        <Link href={`/mkt/estrategias/${id}`}>Estrategia</Link><span>/</span>
        <span>Calendario</span>
      </nav>

      <section className="mkt-hero">
        <div>
          <p>FBR-MKT</p>
          <h1>Calendario 90 Dias</h1>
          <span>{items.length} itens de pauta · {items.filter((i) => i.is_quick_win).length} quick wins</span>
        </div>
        <button onClick={handleExportCsv} className="mkt-cta-btn">Export CSV</button>
      </section>

      <div className="mkt-calendar-filters">
        <button className={`mkt-tab ${canalFilter === 'all' ? 'mkt-tab--active' : ''}`} onClick={() => setCanalFilter('all')}>Todos</button>
        {canais.map((c) => (
          <button key={c} className={`mkt-tab ${canalFilter === c ? 'mkt-tab--active' : ''}`} onClick={() => setCanalFilter(c)}>{c}</button>
        ))}
      </div>

      {items.length === 0 ? (
        <section className="mkt-section"><p>Calendario nao gerado ainda.</p></section>
      ) : (
        <section className="mkt-section">
          <div className="mkt-calendar-weeks">
            {weeks.map((week, wi) => (
              <div key={wi} className="mkt-calendar-week">
                <h3>Semana {wi + 1}</h3>
                <div className="mkt-calendar-days">
                  {week.map((item) => (
                    <div
                      key={item.id}
                      className={`mkt-calendar-day ${item.is_quick_win ? 'mkt-calendar-day--qw' : ''} ${item.tipo === 'pago' ? 'mkt-calendar-day--pago' : ''}`}
                    >
                      <div className="mkt-calendar-day-header">
                        <span>{new Date(item.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                        <span className={`mkt-badge ${item.tipo === 'pago' ? 'mkt-badge--rascunho' : 'mkt-badge--ativa'}`}>{item.tipo}</span>
                      </div>
                      <strong>{item.canal}</strong>
                      <p>{item.tema}</p>
                      <small>{item.copy_resumo}</small>
                      {item.is_quick_win && <span className="mkt-qw-badge">Quick Win</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
