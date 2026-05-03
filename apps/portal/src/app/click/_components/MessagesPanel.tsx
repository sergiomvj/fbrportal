'use client';

import { useState } from 'react';
import type { ClickMessage } from '@/lib/click/types';
import { formatDate } from './format';

export function MessagesPanel({ messages, onSend }: { messages: ClickMessage[]; onSend: (body: string) => void }) {
  const [body, setBody] = useState('');
  const mentions = ['@sdr', '@qualificador', '@proposta', '@negociador', '@closer', '@sucesso'];

  function submit() {
    if (!body.trim()) return;
    onSend(body.trim());
    setBody('');
  }

  return (
    <section className="click-messages" aria-label="Mensagens do deal">
      {messages.map((message) => (
        <article className={`click-message click-message--${message.actorType}`} key={message.id}>
          <header>
            <strong>{message.actorType === 'agent' ? 'AGENTE' : 'Humano'}</strong>
            <span>{formatDate(message.createdAt)}</span>
          </header>
          <p>{message.body}</p>
        </article>
      ))}
      {body.includes('@') && (
        <div className="click-mentions" aria-label="Autocomplete de mencoes">
          {mentions.map((mention) => (
            <button key={mention} onClick={() => setBody(`${body}${mention} `)} type="button">
              {mention}
            </button>
          ))}
        </div>
      )}
      <textarea
        aria-label="Nova mensagem"
        onChange={(event) => setBody(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            submit();
          }
        }}
        value={body}
      />
      <button onClick={submit} type="button">
        Enviar
      </button>
    </section>
  );
}

