'use client';

import { useSession } from '@fbr/auth/client';
import { usePathname } from 'next/navigation';
import { startTransition, useEffect, useMemo, useRef, useState } from 'react';
import { resolveOraculoContext } from '@/lib/oraculo/context';
import type { OraculoQueryResponse } from '@/lib/oraculo/types';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

const OPEN_KEY = 'fbr:oraculo:open';
const WIDTH_KEY = 'fbr:oraculo:width';
const MIN_WIDTH = 280;
const MAX_WIDTH = 560;
const DEFAULT_WIDTH = 320;

function clampWidth(value: number) {
  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, value));
}

export function PortalOraculoShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useSession();
  const context = useMemo(() => resolveOraculoContext(pathname), [pathname]);
  const [isReady, setIsReady] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [panelWidth, setPanelWidth] = useState(DEFAULT_WIDTH);
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<OraculoQueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dragState = useRef<{ startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    setIsReady(true);
    const savedOpen = window.localStorage.getItem(OPEN_KEY);
    const savedWidth = Number(window.localStorage.getItem(WIDTH_KEY));
    setIsOpen(savedOpen === 'true');
    if (Number.isFinite(savedWidth) && savedWidth > 0) {
      setPanelWidth(clampWidth(savedWidth));
    }
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    window.localStorage.setItem(OPEN_KEY, String(isOpen));
  }, [isOpen, isReady]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    window.localStorage.setItem(WIDTH_KEY, String(panelWidth));
  }, [isReady, panelWidth]);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsOpen((current) => !current);
      }
    }

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  useEffect(() => {
    const payload = {
      type: 'ORACULO_CONTEXT' as const,
      payload: {
        module: context.module,
        screen: context.screen,
        pathname: context.pathname,
      },
    };

    if (window.parent && window.parent !== window) {
      window.parent.postMessage(payload, '*');
    }
  }, [context]);

  useEffect(() => {
    function handleMove(event: PointerEvent) {
      if (!dragState.current) {
        return;
      }

      const nextWidth = clampWidth(dragState.current.startWidth + (dragState.current.startX - event.clientX));
      setPanelWidth(nextWidth);
    }

    function handleUp() {
      dragState.current = null;
    }

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, []);

  async function submitQuery(nextQuestion: string) {
    const trimmed = nextQuestion.trim();
    if (trimmed.length < 3) {
      setError('Digite uma pergunta mais especifica para consultar o Oraculo.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/oraculo/query', {
        body: JSON.stringify({ question: trimmed, context }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      });

      const payload = (await response.json()) as OraculoQueryResponse | { error: string };
      if (!response.ok || 'error' in payload) {
        throw new Error('error' in payload ? payload.error : 'Falha ao consultar o Oraculo.');
      }

      startTransition(() => {
        setResult(payload);
      });
    } catch (queryError) {
      setError(queryError instanceof Error ? queryError.message : 'Falha ao consultar o Oraculo.');
    } finally {
      setIsLoading(false);
    }
  }

  const width = isOpen ? panelWidth : 0;

  if (pathname.startsWith('/login')) {
    return <>{children}</>;
  }

  if (pathname.startsWith('/admin')) {
    return (
      <div className="portal-shell">
        <Sidebar />
        <div className="portal-main">
          <Topbar />
          <main className="portal-content">{children}</main>
        </div>
      </div>
    );
  }

  return (
    <div
      className="portal-oraculo-shell"
      style={
        {
          '--oraculo-panel-width': `${width}px`,
        } as React.CSSProperties
      }
    >
      <Sidebar />
      <div className="portal-shell-main">
        <Topbar />
        <div className="portal-oraculo-shell__main">
          <button
            aria-controls="oraculo-panel"
            aria-expanded={isOpen}
            className="portal-oraculo-trigger"
            onClick={() => setIsOpen((current) => !current)}
            type="button"
          >
            <span>Oraculo</span>
            <small>{context.moduleLabel}</small>
          </button>
          {children}
        </div>
      </div>

      <aside
        aria-hidden={!isOpen}
        className="portal-oraculo-panel"
        id="oraculo-panel"
      >
        <button
          aria-label="Redimensionar Oraculo"
          className="portal-oraculo-panel__resize"
          onPointerDown={(event) => {
            dragState.current = { startX: event.clientX, startWidth: panelWidth };
          }}
          type="button"
        />
        <div className="portal-oraculo-panel__content">
          <header className="portal-oraculo-panel__header">
            <div>
              <p>Assistente do sistema</p>
              <h2>Oraculo</h2>
            </div>
            <button className="portal-oraculo-panel__close" onClick={() => setIsOpen(false)} type="button">
              Fechar
            </button>
          </header>

          <section className="portal-oraculo-context" aria-label="Contexto atual do Oraculo">
            <span>{context.moduleLabel}</span>
            <strong>{context.screenLabel}</strong>
            <small>{user?.email ?? 'Operador autenticado'}</small>
          </section>

          <form
            className="portal-oraculo-form"
            onSubmit={(event) => {
              event.preventDefault();
              void submitQuery(question);
            }}
          >
            <label htmlFor="oraculo-question">Pergunte sobre o sistema</label>
            <textarea
              id="oraculo-question"
              name="oraculo-question"
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ex.: Como um SQL entra no pipeline do Click?"
              rows={4}
              value={question}
            />
            <button disabled={isLoading} type="submit">
              {isLoading ? 'Consultando...' : 'Consultar'}
            </button>
          </form>

          <section className="portal-oraculo-suggestions" aria-label="Perguntas sugeridas">
            <header>
              <h3>Perguntas sugeridas</h3>
              <small>{context.pathname}</small>
            </header>
            <div className="portal-oraculo-suggestions__list">
              {context.suggestedQuestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setQuestion(suggestion);
                    void submitQuery(suggestion);
                  }}
                  type="button"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </section>

          {error ? <p className="portal-oraculo-error">{error}</p> : null}

          <section className="portal-oraculo-answer" aria-label="Resposta do Oraculo">
            <header>
              <h3>Resposta grounded</h3>
              <small>Fontes reais do repositorio</small>
            </header>
            <p>{result?.answer ?? 'Abra o painel e faca uma pergunta para consultar codigo e documentacao reais.'}</p>
          </section>

          <section className="portal-oraculo-sources" aria-label="Fontes citadas">
            <header>
              <h3>Citacoes</h3>
            </header>
            {result?.sources?.length ? (
              result.sources.map((source) => (
                <article className="portal-oraculo-source" key={`${source.filePath}:${source.lineStart}`}>
                  <strong>{source.filePath}</strong>
                  <span>
                    Linhas {source.lineStart}-{source.lineEnd}
                  </span>
                  <pre>{source.excerpt}</pre>
                </article>
              ))
            ) : (
              <p className="portal-oraculo-empty">Nenhuma citacao ainda.</p>
            )}
          </section>
        </div>
      </aside>
    </div>
  );
}
