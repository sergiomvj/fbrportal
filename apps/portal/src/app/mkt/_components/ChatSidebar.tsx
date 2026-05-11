'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { MktChatMessage } from '@/lib/mkt/types';

interface ChatSidebarProps {
  estrategiaId: string;
  isOpen: boolean;
  onToggle: () => void;
}

const suggestions = [
  'Refine o posicionamento',
  'Sugira mais canais',
  'Gere variantes de headline',
  'Simule cenario com orcamento reduzido',
  'Ajuste o tom de voz',
  'Resuma a estrategia',
];

export function ChatSidebar({ estrategiaId, isOpen, onToggle }: ChatSidebarProps) {
  const [messages, setMessages] = useState<MktChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const headers = {
    'x-user-id': '33333333-3333-4333-8333-333333333333',
    'x-company-id': '11111111-1111-4111-8111-111111111111',
    'Content-Type': 'application/json',
  };

  const loadMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/proxy/mkt/estrategias/${estrategiaId}/chat`, { headers });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages ?? []);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [estrategiaId]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || sending) return;
    setInput('');
    setSending(true);

    try {
      const res = await fetch(`/api/proxy/mkt/estrategias/${estrategiaId}/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: msg }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.user_message, data.assistant_message]);
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
        {suggestions.map((s) => (
          <button key={s} className="mkt-chat-chip" onClick={() => handleSend(s)}>
            {s}
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
