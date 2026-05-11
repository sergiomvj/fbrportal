'use client';

import type { MktPersona } from '@/lib/mkt/types';

interface PersonaCardProps {
  persona: MktPersona;
}

export function PersonaCard({ persona }: PersonaCardProps) {
  const initials = persona.nome
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="mkt-persona-card">
      <div className="mkt-persona-header">
        <div className="mkt-persona-avatar">{initials}</div>
        <div>
          <h3>{persona.nome}</h3>
          <span>{persona.idade} · {persona.profissao}</span>
        </div>
      </div>

      <div className="mkt-persona-section">
        <h4>Dores</h4>
        <ul>
          {persona.dores.map((d, i) => <li key={i}>{d}</li>)}
        </ul>
      </div>

      <div className="mkt-persona-section">
        <h4>Desejos</h4>
        <ul>
          {persona.desejos.map((d, i) => <li key={i}>{d}</li>)}
        </ul>
      </div>

      <div className="mkt-persona-section">
        <h4>Comportamento Digital</h4>
        <p>{persona.comportamento_digital}</p>
      </div>

      <div className="mkt-persona-section">
        <h4>Canais Preferidos</h4>
        <div className="mkt-persona-channels">
          {persona.canais_preferidos.map((c, i) => (
            <span key={i} className="mkt-badge mkt-badge--ativa">{c}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
