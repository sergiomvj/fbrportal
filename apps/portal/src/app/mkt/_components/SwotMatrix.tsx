'use client';

import type { MktSwot } from '@/lib/mkt/types';

interface SwotMatrixProps {
  swot: MktSwot;
  editable?: boolean;
  onChange?: (swot: MktSwot) => void;
}

const quadrants = [
  { key: 'forcas' as const, label: 'Forcas', color: '#10B981', icon: '💪' },
  { key: 'fraquezas' as const, label: 'Fraquezas', color: '#EF4444', icon: '⚠️' },
  { key: 'oportunidades' as const, label: 'Oportunidades', color: '#0EA5E9', icon: '🚀' },
  { key: 'ameacas' as const, label: 'Ameacas', color: '#F59E0B', icon: '🔒' },
];

export function SwotMatrix({ swot, editable = false, onChange }: SwotMatrixProps) {
  const handleEdit = (key: keyof MktSwot, index: number, value: string) => {
    if (!onChange) return;
    const updated = { ...swot };
    updated[key] = [...updated[key]];
    updated[key][index] = value;
    onChange(updated);
  };

  return (
    <div className="mkt-swot-grid">
      {quadrants.map((q) => (
        <div key={q.key} className="mkt-swot-quadrant" style={{ borderColor: q.color }}>
          <h3 style={{ color: q.color }}>{q.icon} {q.label}</h3>
          <ul>
            {swot[q.key].map((item, i) => (
              <li key={i}>
                {editable ? (
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleEdit(q.key, i, e.target.value)}
                  />
                ) : (
                  <span>{item}</span>
                )}
              </li>
            ))}
          </ul>
          {swot[q.key].length < 3 && (
            <small className="mkt-swot-warning">Minimo 3 itens recomendado</small>
          )}
        </div>
      ))}
    </div>
  );
}
