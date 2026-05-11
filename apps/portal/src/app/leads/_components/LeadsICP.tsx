'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import type { ICP } from '@/lib/leads/types';
import { requestJson } from './api';

const navItems = [
  { href: '/leads', label: 'Overview' },
  { href: '/leads/pipeline', label: 'Pipeline' },
  { href: '/leads/domains', label: 'Dominios' },
  { href: '/leads/icp', label: 'ICP' },
  { href: '/leads/agents', label: 'Agentes' },
  { href: '/leads/campaigns', label: 'Campanhas' },
  { href: '/leads/reports', label: 'Relatorios' },
];

function emptyDraft() {
  return {
    nome: '',
    descricao: '',
    setor: '',
    porte: '',
    cargo_alvo: '',
    regiao: '',
    score_minimo: 60,
    keywords: '',
    exclusoes: '',
    porte_funcionarios_min: 0,
    porte_funcionarios_max: 0,
    ativo: true,
  };
}

function parseList(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

export function LeadsICP({ icps: initialIcps }: { icps: ICP[] }) {
  const [icps, setIcps] = useState(initialIcps);
  const [draft, setDraft] = useState(emptyDraft());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payloadBase = {
      nome: draft.nome,
      descricao: draft.descricao,
      setor: parseList(draft.setor),
      porte: parseList(draft.porte),
      cargo_alvo: parseList(draft.cargo_alvo),
      regiao: parseList(draft.regiao),
      score_minimo: draft.score_minimo,
      keywords: parseList(draft.keywords),
      exclusoes: parseList(draft.exclusoes),
      porte_funcionarios_min: draft.porte_funcionarios_min || undefined,
      porte_funcionarios_max: draft.porte_funcionarios_max || undefined,
      ativo: draft.ativo,
      dominio_email_permitido: ['todos'],
    };

    try {
      if (editingId) {
        const payload = await requestJson<{ icp: ICP }>('/api/proxy/leads/icp', {
          method: 'PATCH',
          body: JSON.stringify({ id: editingId, ...payloadBase }),
        });
        setIcps((current) => current.map((icp) => (icp.id === payload.icp.id ? payload.icp : icp)));
      } else {
        const payload = await requestJson<{ icp: ICP }>('/api/proxy/leads/icp', {
          method: 'POST',
          body: JSON.stringify(payloadBase),
        });
        setIcps((current) => [payload.icp, ...current]);
      }

      setEditingId(null);
      setDraft(emptyDraft());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível salvar o ICP.');
    } finally {
      setSaving(false);
    }
  }

  async function removeIcp(id: string) {
    setError(null);
    try {
      await requestJson('/api/proxy/leads/icp', {
        method: 'DELETE',
        body: JSON.stringify({ id }),
      });
      setIcps((current) => current.filter((icp) => icp.id !== id));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível excluir o ICP.');
    }
  }

  function editIcp(icp: ICP) {
    setEditingId(icp.id!);
    setDraft({
      nome: icp.nome,
      descricao: icp.descricao ?? '',
      setor: icp.setor.join(', '),
      porte: icp.porte.join(', '),
      cargo_alvo: icp.cargo_alvo.join(', '),
      regiao: icp.regiao.join(', '),
      score_minimo: icp.score_minimo,
      keywords: icp.keywords.join(', '),
      exclusoes: icp.exclusoes.join(', '),
      porte_funcionarios_min: icp.porte_funcionarios_min ?? 0,
      porte_funcionarios_max: icp.porte_funcionarios_max ?? 0,
      ativo: icp.ativo,
    });
  }

  return (
    <main className="leads-shell">
      <section className="leads-hero leads-hero--compact">
        <div>
          <p>FBR-Leads</p>
          <h1>Configuracao de ICP</h1>
          <span>Adicione, ajuste e remova perfis ideais com foco comercial e operacional.</span>
        </div>
      </section>

      <nav className="leads-nav-tabs">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} data-active={item.href === '/leads/icp' ? 'true' : undefined}>
            {item.label}
          </Link>
        ))}
      </nav>

      <section className="leads-section" aria-label="ICPs">
        <header>
          <div>
            <p>ICP</p>
            <h2>{icps.filter((icp) => icp.ativo).length} ICPs Ativos</h2>
          </div>
        </header>

        <form className="leads-form-card" onSubmit={submit}>
          <div className="leads-form-card__header">
            <div>
              <p>{editingId ? 'Edicao' : 'Novo ICP'}</p>
              <h3>{editingId ? 'Alterar ICP' : 'Adicionar ICP'}</h3>
            </div>
            {editingId && (
              <button
                className="leads-ghost-button"
                onClick={() => {
                  setEditingId(null);
                  setDraft(emptyDraft());
                }}
                type="button"
              >
                Cancelar
              </button>
            )}
          </div>

          <div className="leads-form-grid">
            <label>
              <span>Nome</span>
              <input onChange={(event) => setDraft((current) => ({ ...current, nome: event.target.value }))} value={draft.nome} />
            </label>
            <label>
              <span>Score minimo</span>
              <input min={1} max={100} onChange={(event) => setDraft((current) => ({ ...current, score_minimo: Number(event.target.value) }))} type="number" value={draft.score_minimo} />
            </label>
            <label className="leads-form-grid__full">
              <span>Descricao</span>
              <textarea onChange={(event) => setDraft((current) => ({ ...current, descricao: event.target.value }))} rows={3} value={draft.descricao} />
            </label>
            <label>
              <span>Setores</span>
              <input onChange={(event) => setDraft((current) => ({ ...current, setor: event.target.value }))} placeholder="Tecnologia, SaaS" value={draft.setor} />
            </label>
            <label>
              <span>Portes</span>
              <input onChange={(event) => setDraft((current) => ({ ...current, porte: event.target.value }))} placeholder="Pequeno, Medio" value={draft.porte} />
            </label>
            <label>
              <span>Cargos alvo</span>
              <input onChange={(event) => setDraft((current) => ({ ...current, cargo_alvo: event.target.value }))} placeholder="CMO, CEO" value={draft.cargo_alvo} />
            </label>
            <label>
              <span>Regioes</span>
              <input onChange={(event) => setDraft((current) => ({ ...current, regiao: event.target.value }))} placeholder="SP, RJ" value={draft.regiao} />
            </label>
            <label>
              <span>Keywords</span>
              <input onChange={(event) => setDraft((current) => ({ ...current, keywords: event.target.value }))} placeholder="growth, outbound" value={draft.keywords} />
            </label>
            <label>
              <span>Exclusoes</span>
              <input onChange={(event) => setDraft((current) => ({ ...current, exclusoes: event.target.value }))} placeholder="freelancer, estagiario" value={draft.exclusoes} />
            </label>
            <label>
              <span>Porte minimo</span>
              <input min={0} onChange={(event) => setDraft((current) => ({ ...current, porte_funcionarios_min: Number(event.target.value) }))} type="number" value={draft.porte_funcionarios_min} />
            </label>
            <label>
              <span>Porte maximo</span>
              <input min={0} onChange={(event) => setDraft((current) => ({ ...current, porte_funcionarios_max: Number(event.target.value) }))} type="number" value={draft.porte_funcionarios_max} />
            </label>
          </div>

          <div className="leads-checkbox-row">
            <label><input checked={draft.ativo} onChange={(event) => setDraft((current) => ({ ...current, ativo: event.target.checked }))} type="checkbox" /> ICP ativo</label>
          </div>

          {error && <p className="leads-form-error">{error}</p>}
          <button disabled={saving} type="submit">{saving ? 'Salvando...' : editingId ? 'Atualizar ICP' : 'Adicionar ICP'}</button>
        </form>

        <div className="leads-icp-grid">
          {icps.map((icp) => (
            <div key={icp.id} className="leads-icp-card">
              <div className="leads-card-actions">
                <button className="leads-ghost-button" onClick={() => editIcp(icp)} type="button">Editar</button>
                <button className="leads-danger-button" onClick={() => removeIcp(icp.id!)} type="button">Excluir</button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>{icp.nome}</h3>
                <span className={`leads-badge ${icp.ativo ? 'leads-badge--online' : 'leads-badge--offline'}`}>
                  {icp.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>

              {icp.descricao && <p>{icp.descricao}</p>}

              {icp.setor.length > 0 && (
                <div className="leads-icp-tags">
                  {icp.setor.map((setor) => <span key={setor}>{setor}</span>)}
                </div>
              )}

              {icp.cargo_alvo.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <div className="leads-subtitle">Cargos Alvo</div>
                  <div className="leads-icp-tags">
                    {icp.cargo_alvo.map((cargo) => <span key={cargo} style={{ background: 'rgba(14, 165, 233, 0.12)', color: '#7dd3fc' }}>{cargo}</span>)}
                  </div>
                </div>
              )}

              {icp.regiao.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <div className="leads-subtitle">Regioes</div>
                  <div className="leads-icp-tags">
                    {icp.regiao.map((regiao) => <span key={regiao} style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#c4b5fd' }}>{regiao}</span>)}
                  </div>
                </div>
              )}

              {icp.keywords.length > 0 && (
                <div style={{ marginBottom: '10px' }}>
                  <div className="leads-subtitle">Keywords</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--leads-muted-light)', fontFamily: 'var(--fbr-font-code, monospace)' }}>
                    {icp.keywords.join(', ')}
                  </div>
                </div>
              )}

              <div className="leads-icp-stats">
                <span>Score min: <strong>{icp.score_minimo}</strong></span>
                <span>Leads: <strong>{icp.total_leads}</strong></span>
                <span>SQLs: <strong>{icp.total_sqls}</strong></span>
                <span>Conversao: <strong>{icp.taxa_conversao}%</strong></span>
              </div>

              {(icp.porte_funcionarios_min || icp.porte_funcionarios_max) && (
                <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--leads-muted)' }}>
                  Porte: {icp.porte_funcionarios_min ?? 0} - {icp.porte_funcionarios_max ?? '∞'} funcionarios
                </div>
              )}

              {icp.exclusoes.length > 0 && (
                <div style={{ marginTop: '6px', fontSize: '0.75rem', color: 'var(--leads-muted)' }}>
                  Exclusoes: {icp.exclusoes.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
