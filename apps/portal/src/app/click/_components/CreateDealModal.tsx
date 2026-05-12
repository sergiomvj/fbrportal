'use client';

import { useState } from 'react';
import { z } from 'zod';
import { createDealSchema } from '@/lib/click/schemas';
import type { ClickDeal } from '@/lib/click/types';

type FormState = z.infer<typeof createDealSchema>;

const initialForm: FormState = {
  title: '',
  companyName: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  valueCents: 0,
  stage: 'contato_inicial',
  source: 'manual',
  priority: 'media',
  score: 50,
};

export function CreateDealModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (input: FormState) => Promise<ClickDeal>;
}) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState('');

  if (!open) return null;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setFailure('');
    const parsed = createDealSchema.safeParse(form);

    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message])));
      setSubmitting(false);
      return;
    }

    try {
      await onCreate(parsed.data);
      setForm(initialForm);
      onClose();
    } catch (error) {
      setFailure(error instanceof Error ? error.message : 'Falha ao criar deal.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="click-modal-backdrop" onMouseDown={onClose}>
      <form className="click-modal" onMouseDown={(event) => event.stopPropagation()} onSubmit={submit}>
        <header className="click-modal__header">
          <h2>Criar deal</h2>
          <button aria-label="Fechar modal" onClick={onClose} type="button">
            x
          </button>
        </header>
        <label>
          Titulo
          <input value={form.title} onChange={(event) => update('title', event.target.value)} />
          {errors.title && <span>{errors.title}</span>}
        </label>
        <label>
          Empresa
          <input value={form.companyName} onChange={(event) => update('companyName', event.target.value)} />
          {errors.companyName && <span>{errors.companyName}</span>}
        </label>
        <label>
          Contato
          <input value={form.contactName} onChange={(event) => update('contactName', event.target.value)} />
        </label>
        <label>
          E-mail
          <input value={form.contactEmail} onChange={(event) => update('contactEmail', event.target.value)} />
          {errors.contactEmail && <span>{errors.contactEmail}</span>}
        </label>
        <label>
          Telefone
          <input value={form.contactPhone} onChange={(event) => update('contactPhone', event.target.value)} />
        </label>
        <div className="click-modal__grid">
          <label>
            Valor
            <input
              min={0}
              type="number"
              value={form.valueCents / 100}
              onChange={(event) => update('valueCents', Math.round(Number(event.target.value) * 100))}
            />
          </label>
          <label>
            Score
            <input
              max={100}
              min={0}
              type="number"
              value={form.score}
              onChange={(event) => update('score', Number(event.target.value))}
            />
          </label>
        </div>
        <div className="click-modal__grid">
          <label>
            Estagio
            <select value={form.stage} onChange={(event) => update('stage', event.target.value as FormState['stage'])}>
              <option value="contato_inicial">Contato Inicial</option>
              <option value="descoberta">Descoberta</option>
              <option value="proposta">Proposta</option>
              <option value="negociacao">Negociacao</option>
              <option value="fechamento">Fechamento</option>
            </select>
          </label>
          <label>
            Origem
            <select value={form.source} onChange={(event) => update('source', event.target.value as FormState['source'])}>
              <option value="manual">Manual</option>
              <option value="fbr_leads">FBR-Leads</option>
            </select>
          </label>
        </div>
        <div className="click-modal__grid">
          <label>
            Prioridade
            <select
              value={form.priority}
              onChange={(event) => update('priority', event.target.value as FormState['priority'])}
            >
              <option value="baixa">Baixa</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
            </select>
          </label>
        </div>
        {failure && <p role="alert">{failure}</p>}
        <button disabled={submitting} type="submit">
          {submitting ? 'Criando...' : 'Criar deal'}
        </button>
      </form>
    </div>
  );
}
