'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { Alerta } from '@/lib/redacao/types';

const navItems = [
  { href: '/redacao', label: 'Dashboard' },
  { href: '/redacao/producao', label: 'Producao' },
  { href: '/redacao/publicados', label: 'Publicados' },
  { href: '/redacao/fontes', label: 'Fontes' },
  { href: '/redacao/ugc', label: 'UGC' },
  { href: '/redacao/alertas', label: 'Alertas' },
];

const nivelLabels: Record<string, string> = {
  info: 'Info',
  warn: 'Warn',
  error: 'Error',
};

export function RedacaoAlertas({ alertas }: { alertas: Alerta[] }) {
  const [selectedNivel, setSelectedNivel] = useState<string>('');
  const [showResolvido, setShowResolvido] = useState(false);

  const filtered = useMemo(() => {
    return alertas.filter((alerta) => {
      if (selectedNivel && alerta.nivel !== selectedNivel) return false;
      if (!showResolvido && alerta.resolvido) return false;
      return true;
    });
  }, [alertas, selectedNivel, showResolvido]);

  return (
    <main className="redacao-shell">
      <section className="redacao-hero redacao-hero--compact">
        <div>
          <p>FBR-Redacao</p>
          <h1>Alertas</h1>
          <span>Notificacoes e avisos do sistema</span>
        </div>
      </section>

      <nav className="redacao-nav-tabs">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} data-active={item.label === 'Alertas'}>{item.label}</Link>
        ))}
      </nav>

      <div className="redacao-status-filter" style={{ marginBottom: 16 }}>
        <button aria-pressed={!selectedNivel} onClick={() => setSelectedNivel('')} type="button">Todos</button>
        {Object.entries(nivelLabels).map(([key, label]) => (
          <button key={key} aria-pressed={selectedNivel === key} onClick={() => setSelectedNivel(selectedNivel === key ? '' : key)} type="button">
            {label}
          </button>
        ))}
        <button
          aria-pressed={showResolvido}
          onClick={() => setShowResolvido(!showResolvido)}
          type="button"
          style={{ marginLeft: 8, borderColor: showResolvido ? 'var(--redacao)' : undefined }}
        >
          Resolvidos
        </button>
      </div>

      <div className="redacao-card" style={{ padding: 0 }}>
        {filtered.length === 0 && (
          <div className="redacao-empty">Nenhum alerta encontrado.</div>
        )}
        {filtered.map((alerta) => (
          <div key={alerta.id} className="redacao-alert-entry">
            <span className="redacao-alert-time">
              {alerta.created_at ? new Date(alerta.created_at).toLocaleString('pt-BR') : '-'}
            </span>
            <span className={`redacao-badge redacao-badge--${alerta.nivel}`}>{nivelLabels[alerta.nivel] ?? alerta.nivel}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--redacao-muted)', whiteSpace: 'nowrap' }}>{alerta.tipo.replace(/_/g, ' ')}</span>
            <span className="redacao-alert-msg">{alerta.mensagem}</span>
            {alerta.agente && <span style={{ fontSize: '0.75rem', color: 'var(--redacao-muted)', fontFamily: 'var(--fbr-font-code, monospace)' }}>{alerta.agente}</span>}
            <span className={`redacao-badge ${alerta.resolvido ? 'redacao-badge--publicado' : 'redacao-badge--erro'}`}>
              {alerta.resolvido ? 'Resolvido' : 'Aberto'}
            </span>
          </div>
        ))}
      </div>
    </main>
  );
}
