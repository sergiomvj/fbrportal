import { useState, useEffect, useRef, useCallback } from 'react';
import type { MktChatMessage } from '@/lib/mkt/types';

interface ChatSidebarProps {
  estrategiaId: string;
  isOpen: boolean;
  onToggle: () => void;
}

const defaultSuggestions = [
  'Refine o posicionamento',
  'Sugira mais canais',
  'Gere variantes de headline',
  'Simule cenario com orcamento reduzido',
  'Ajuste o tom de voz',
  'Resuma a estrategia',
];

export function ChatSidebar({ estrategiaId, isOpen, onToggle }: ChatSidebarProps) {
  const [messages, setMessages] = useState<MktChatMessage[]>([]);
  const [contextSuggestions, setContextSuggestions] = useState<string[]>(defaultSuggestions);
  const [inconsistencyFlags, setInconsistencyFlags] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/proxy/mkt/estrategias/${estrategiaId}/chat`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages ?? []);
        setContextSuggestions(data.suggestions?.length ? data.suggestions : defaultSuggestions);
        setInconsistencyFlags(data.inconsistencyFlags ?? []);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [estrategiaId]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        onToggle();
      }
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [onToggle]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || sending) return;
    setInput('');
    setSending(true);

    const newAsstId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: 'user', conteudo: msg, estrategia_id: estrategiaId, created_at: new Date().toISOString() },
      { id: newAsstId, role: 'assistant', conteudo: '', estrategia_id: estrategiaId, created_at: new Date().toISOString() }
    ]);

    try {
      const res = await fetch(`/api/proxy/mkt/estrategias/${estrategiaId}/chat`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null) as { message?: string } | null;
        const errorMessage = body?.message ?? 'Nao foi possivel processar a mensagem agora.';
        setMessages((prev) => prev.map(m => m.id === newAsstId ? { ...m, conteudo: errorMessage } : m));
        return;
      }
      if (res.ok && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let assistantText = '';
        let sseBuffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          if (res.headers.get('content-type')?.includes('text/event-stream')) {
            sseBuffer += chunk;
            const events = sseBuffer.split('\n\n');
            sseBuffer = events.pop() ?? '';
            for (const event of events) {
              const eventType = event.split('\n').find((line) => line.startsWith('event: '))?.slice(7);
              const dataLine = event.split('\n').find((line) => line.startsWith('data: '));
              if (!dataLine || eventType === 'done') continue;
              const payload = JSON.parse(dataLine.slice(6)) as { delta?: string; message?: string };
              if (eventType === 'error') {
                assistantText = payload.message ?? 'Erro no stream do assistente.';
              } else {
                assistantText += payload.delta ?? '';
              }
            }
          } else {
            assistantText += chunk;
          }
          setMessages((prev) => prev.map(m => m.id === newAsstId ? { ...m, conteudo: assistantText } : m));
        }
      }
    } catch { /* ignore */ }
    finally { setSending(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <button className="mkt-chat-toggle" onClick={onToggle} title="Abrir Chat (Ctrl+K)">
        💬
      </button>
    );
  }

  return (
    <aside className="mkt-chat-sidebar">
      <div className="mkt-chat-header">
        <h3>Assistente MKT</h3>
        <button onClick={onToggle} className="mkt-chat-close">✕</button>
      </div>

      <div className="mkt-chat-messages" ref={scrollRef}>
        {loading ? (
          <p className="mkt-chat-loading">Carregando historico...</p>
        ) : messages.length === 0 ? (
          <p className="mkt-chat-empty">Nenhuma mensagem ainda. Comece uma conversa!</p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`mkt-chat-msg mkt-chat-msg--${msg.role}`}>
              <div className="mkt-chat-msg-header">
                <span>{msg.role === 'user' ? 'Voce' : 'Assistente'}</span>
              </div>
              <p>{msg.conteudo}</p>
            </div>
          ))
        )}
        {sending && (
          <div className="mkt-chat-msg mkt-chat-msg--assistant">
            <p className="mkt-chat-typing">digitando...</p>
          </div>
        )}
      </div>

      <div className="mkt-chat-suggestions">
        {[...contextSuggestions, ...inconsistencyFlags.map((flag) => `Corrigir ${flag}`)].slice(0, 6).map((suggestion) => (
          <button key={suggestion} className="mkt-chat-chip" onClick={() => handleSend(suggestion)}>
            {suggestion}
          </button>
        ))}
      </div>

      <div className="mkt-chat-input-area">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Pergunte sobre a estrategia..."
          rows={2}
          maxLength={2000}
        />
        <button onClick={() => handleSend()} disabled={!input.trim() || sending}>
          Enviar
        </button>
      </div>
    </aside>
  );
}
