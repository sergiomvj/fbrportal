'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ArvaAgent } from '@fbr/arva-integration';

export interface LinkedAgentSelection {
  agent: ArvaAgent;
  moduleId?: string | undefined;
}

export interface AgentPickerProps {
  companyId: string;
  moduleId?: string;
  agents: ArvaAgent[];
  linkedAgents?: ArvaAgent[];
  moduleTags?: string[];
  loading?: boolean;
  error?: string;
  onSelect: (selection: LinkedAgentSelection) => void;
  triggerLabel?: string;
}

const focusableSelector = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function agentMatchesTags(agent: ArvaAgent, activeTag: string | null): boolean {
  return activeTag === null || agent.tags.includes(activeTag);
}

function uniqueTags(agents: ArvaAgent[], moduleTags: string[]): string[] {
  return Array.from(new Set([...moduleTags, ...agents.flatMap((agent) => agent.tags)])).filter(Boolean);
}

export function AgentPicker({
  agents,
  linkedAgents = [],
  moduleTags = [],
  moduleId,
  loading = false,
  error,
  onSelect,
  triggerLabel = 'Incluir Agente',
}: AgentPickerProps) {
  const [open, setOpen] = useState(false);
  const [activeTag, setActiveTag] = useState<string | null>(moduleTags[0] ?? null);
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const tags = useMemo(() => uniqueTags(agents, moduleTags), [agents, moduleTags]);
  const visibleAgents = useMemo(() => agents.filter((agent) => agentMatchesTags(agent, activeTag)), [activeTag, agents]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const dialog = dialogRef.current;
    const firstFocusable = dialog?.querySelector<HTMLElement>(focusableSelector);
    firstFocusable?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }

      if (event.key !== 'Tab' || !dialog) {
        return;
      }

      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector));
      const first = focusable[0];
      const last = focusable.at(-1);

      if (!first || !last) {
        return;
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }

      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  function selectAgent(agent: ArvaAgent) {
    onSelect({ agent, moduleId });
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <section className="fbr-agent-picker" aria-label="Arva agent picker">
      <button className="fbr-agent-picker__trigger" onClick={() => setOpen(true)} ref={triggerRef} type="button">
        {triggerLabel}
      </button>

      {linkedAgents.length > 0 && (
        <div className="fbr-agent-picker__linked" aria-label="Agentes vinculados">
          {linkedAgents.map((agent) => (
            <AgentCard agent={agent} key={agent.id} linked />
          ))}
        </div>
      )}

      {open && (
        <div className="fbr-agent-picker__backdrop" onMouseDown={() => setOpen(false)}>
          <div
            aria-labelledby={titleId}
            aria-modal="true"
            className="fbr-agent-picker__dialog fbr-glass-surface"
            onMouseDown={(event) => event.stopPropagation()}
            ref={dialogRef}
            role="dialog"
          >
            <header className="fbr-agent-picker__header">
              <div>
                <p className="fbr-agent-picker__eyebrow">Arva Platform</p>
                <h2 className="fbr-agent-picker__title" id={titleId}>
                  Incluir Agente
                </h2>
              </div>
              <button
                aria-label="Fechar seletor de agentes"
                className="fbr-agent-picker__close"
                onClick={() => setOpen(false)}
                type="button"
              >
                x
              </button>
            </header>

            {tags.length > 0 && (
              <div aria-label="Filtrar agentes por tag" className="fbr-agent-picker__filters" role="toolbar">
                <button
                  aria-pressed={activeTag === null}
                  className="fbr-agent-picker__filter"
                  onClick={() => setActiveTag(null)}
                  type="button"
                >
                  todos
                </button>
                {tags.map((tag) => (
                  <button
                    aria-pressed={activeTag === tag}
                    className="fbr-agent-picker__filter"
                    key={tag}
                    onClick={() => setActiveTag(tag)}
                    type="button"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}

            {loading && <p className="fbr-agent-picker__message">Carregando agentes...</p>}
            {error && (
              <p className="fbr-agent-picker__message" role="alert">
                {error}
              </p>
            )}
            {!loading && !error && visibleAgents.length === 0 && (
              <p className="fbr-agent-picker__message">Nenhum agente encontrado para este filtro.</p>
            )}
            {!loading && !error && visibleAgents.length > 0 && (
              <div className="fbr-agent-picker__grid">
                {visibleAgents.map((agent) => (
                  <AgentCard agent={agent} key={agent.id} onSelect={selectAgent} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function AgentCard({
  agent,
  linked = false,
  onSelect,
}: {
  agent: ArvaAgent;
  linked?: boolean;
  onSelect?: (agent: ArvaAgent) => void;
}) {
  const statusLabel = agent.status === 'active' ? 'ativo' : 'inativo';

  return (
    <article className={`fbr-agent-picker__${linked ? 'linked-card' : 'card'} fbr-card`}>
      <div className="fbr-agent-picker__agent-row">
        <div className="fbr-agent-picker__avatar">
          {agent.avatarUrl ? (
            <img
              alt={`Avatar de ${agent.name}`}
              className="fbr-agent-picker__avatar-img"
              src={agent.avatarUrl}
            />
          ) : (
            initials(agent.name)
          )}
        </div>
        <div>
          <p className="fbr-agent-picker__name">{agent.name}</p>
          <p className="fbr-agent-picker__role">{agent.role}</p>
        </div>
      </div>

      <span className="fbr-agent-picker__badge">AGENTE</span>
      <span className="fbr-agent-picker__status">
        <span
          aria-hidden="true"
          className={`fbr-agent-picker__heartbeat ${
            agent.status === 'active' ? 'fbr-agent-picker__heartbeat--active' : ''
          }`}
        />
        <span>Status {statusLabel}</span>
      </span>

      {agent.tags.length > 0 && (
        <div className="fbr-agent-picker__tags" aria-label={`Tags de ${agent.name}`}>
          {agent.tags.map((tag) => (
            <span className="fbr-agent-picker__tag" key={tag}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {!linked && onSelect && (
        <button className="fbr-agent-picker__link-button" onClick={() => onSelect(agent)} type="button">
          Vincular agente
        </button>
      )}
    </article>
  );
}
