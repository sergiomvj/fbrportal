'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import type { Domain } from '@/lib/leads/types';
import { requestJson } from './api';

const phaseLabels: Record<string, string> = {
  fase1: 'Fase 1 (Dias 1-30)',
  fase2: 'Fase 2 (Dias 31-60)',
  fase3: 'Fase 3 (Dias 61-90)',
  fase4: 'Fase 4 (Dia 90+)',
};

const phaseLimits: Record<string, string> = {
  fase1: 'Interno apenas',
  fase2: '10-20/dia',
  fase3: '30-50/dia',
  fase4: '50-100/dia',
};

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
    dominio: '',
    status: 'aquecendo',
    warming_phase: 'fase1',
    warming_dia: 0,
    bounce_rate: 0,
    envios_hoje: 0,
    limite_diario: 10,
    open_rate: 0,
    blacklist: false,
    spf_ok: false,
    dkim_ok: false,
    dmarc_ok: false,
    total_envios_7d: 0,
    total_bounces_7d: 0,
  };
}

export function LeadsDomains({ domains: initialDomains }: { domains: Domain[] }) {
  const [domains, setDomains] = useState(initialDomains);
  const [draft, setDraft] = useState(emptyDraft());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (editingId) {
        const payload = await requestJson<{ domain: Domain }>('/api/proxy/leads/domains', {
          method: 'PATCH',
          body: JSON.stringify({ id: editingId, ...draft }),
        });
        setDomains((current) => current.map((domain) => (domain.id === payload.domain.id ? payload.domain : domain)));
      } else {
        const payload = await requestJson<{ domain: Domain }>('/api/proxy/leads/domains', {
          method: 'POST',
          body: JSON.stringify(draft),
        });
        setDomains((current) => [payload.domain, ...current]);
      }

      setEditingId(null);
      setDraft(emptyDraft());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível salvar o domínio.');
    } finally {
      setSaving(false);
    }
  }

  async function removeDomain(id: string) {
    setError(null);
    try {
      await requestJson('/api/proxy/leads/domains', {
        method: 'DELETE',
        body: JSON.stringify({ id }),
      });
      setDomains((current) => current.filter((domain) => domain.id !== id));
      if (editingId === id) {
        setEditingId(null);
        setDraft(emptyDraft());
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível excluir o domínio.');
    }
  }

  function editDomain(domain: Domain) {
    setEditingId(domain.id!);
    setDraft({
      dominio: domain.dominio,
      status: domain.status,
      warming_phase: domain.warming_phase,
      warming_dia: domain.warming_dia,
      bounce_rate: domain.bounce_rate,
      envios_hoje: domain.envios_hoje,
      limite_diario: domain.limite_diario,
      open_rate: domain.open_rate,
      blacklist: domain.blacklist,
      spf_ok: domain.spf_ok,
      dkim_ok: domain.dkim_ok,
      dmarc_ok: domain.dmarc_ok,
      total_envios_7d: domain.total_envios_7d,
      total_bounces_7d: domain.total_bounces_7d,
    });
  }

  return (
    <main className="leads-shell">
      <section className="leads-hero leads-hero--compact">
        <div>
          <p>FBR-Leads</p>
          <h1>Saude dos Dominios</h1>
          <span>Cadastre, ajuste e acompanhe reputacao, aquecimento e limites de envio.</span>
        </div>
      </section>

      <nav className="leads-nav-tabs">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} data-active={item.href === '/leads/domains' ? 'true' : undefined}>
            {item.label}
          </Link>
        ))}
      </nav>

      <section className="leads-section" aria-label="Dominios">
        <header>
          <div>
            <p>Mail Server</p>
            <h2>Protocolo de Aquecimento</h2>
          </div>
        </header>

        <div className="leads-table-wrap" style={{ marginBottom: '24px' }}>
          <table className="leads-table" style={{ minWidth: 'auto' }}>
            <thead>
              <tr>
                <th>Fase</th>
                <th>Periodo</th>
                <th>Volume/Dia</th>
                <th>Atividade</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style={{ color: 'var(--sky)' }}>Fase 1</td><td>Dias 1-30</td><td>Interno apenas</td><td>Trocas internas, sem envio externo</td></tr>
              <tr><td style={{ color: 'var(--sky)' }}>Fase 2</td><td>Dias 31-60</td><td>10-20 e-mails</td><td>Primeiros contatos externos</td></tr>
              <tr><td style={{ color: 'var(--sky)' }}>Fase 3</td><td>Dias 61-90</td><td>30-50 e-mails</td><td>Volume controlado com cadencia 4 toques</td></tr>
              <tr><td style={{ color: 'var(--sky)' }}>Fase 4</td><td>Dia 90+</td><td>50-100 e-mails</td><td>Operacao plena com monitoramento continuo</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="leads-section" aria-label="Gestao de dominios">
        <header>
          <div>
            <p>CRUD</p>
            <h2>{domains.length} Dominios Ativos</h2>
          </div>
        </header>

        <form className="leads-form-card" onSubmit={submit}>
          <div className="leads-form-card__header">
            <div>
              <p>{editingId ? 'Edicao' : 'Novo dominio'}</p>
              <h3>{editingId ? 'Alterar dominio' : 'Adicionar dominio'}</h3>
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
              <span>Dominio</span>
              <input onChange={(event) => setDraft((current) => ({ ...current, dominio: event.target.value }))} value={draft.dominio} />
            </label>
            <label>
              <span>Status</span>
              <select onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))} value={draft.status}>
                <option value="saudavel">saudavel</option>
                <option value="aquecendo">aquecendo</option>
                <option value="atencao">atencao</option>
                <option value="critico">critico</option>
                <option value="bloqueado">bloqueado</option>
              </select>
            </label>
            <label>
              <span>Fase</span>
              <select onChange={(event) => setDraft((current) => ({ ...current, warming_phase: event.target.value }))} value={draft.warming_phase}>
                <option value="fase1">fase1</option>
                <option value="fase2">fase2</option>
                <option value="fase3">fase3</option>
                <option value="fase4">fase4</option>
              </select>
            </label>
            <label>
              <span>Dia de aquecimento</span>
              <input min={0} onChange={(event) => setDraft((current) => ({ ...current, warming_dia: Number(event.target.value) }))} type="number" value={draft.warming_dia} />
            </label>
            <label>
              <span>Limite diario</span>
              <input min={0} onChange={(event) => setDraft((current) => ({ ...current, limite_diario: Number(event.target.value) }))} type="number" value={draft.limite_diario} />
            </label>
            <label>
              <span>Envios hoje</span>
              <input min={0} onChange={(event) => setDraft((current) => ({ ...current, envios_hoje: Number(event.target.value) }))} type="number" value={draft.envios_hoje} />
            </label>
            <label>
              <span>Bounce rate</span>
              <input min={0} onChange={(event) => setDraft((current) => ({ ...current, bounce_rate: Number(event.target.value) }))} step="0.1" type="number" value={draft.bounce_rate} />
            </label>
            <label>
              <span>Open rate</span>
              <input min={0} onChange={(event) => setDraft((current) => ({ ...current, open_rate: Number(event.target.value) }))} step="0.1" type="number" value={draft.open_rate} />
            </label>
          </div>

          <div className="leads-checkbox-row">
            <label><input checked={draft.spf_ok} onChange={(event) => setDraft((current) => ({ ...current, spf_ok: event.target.checked }))} type="checkbox" /> SPF OK</label>
            <label><input checked={draft.dkim_ok} onChange={(event) => setDraft((current) => ({ ...current, dkim_ok: event.target.checked }))} type="checkbox" /> DKIM OK</label>
            <label><input checked={draft.dmarc_ok} onChange={(event) => setDraft((current) => ({ ...current, dmarc_ok: event.target.checked }))} type="checkbox" /> DMARC OK</label>
            <label><input checked={draft.blacklist} onChange={(event) => setDraft((current) => ({ ...current, blacklist: event.target.checked }))} type="checkbox" /> Em blacklist</label>
          </div>

          {error && <p className="leads-form-error">{error}</p>}
          <button disabled={saving} type="submit">{saving ? 'Salvando...' : editingId ? 'Atualizar dominio' : 'Adicionar dominio'}</button>
        </form>

        <div className="leads-domain-grid">
          {domains.map((domain) => {
            const pct = domain.limite_diario > 0 ? Math.round((domain.envios_hoje / domain.limite_diario) * 100) : 0;
            const barColor = domain.status === 'saudavel' ? 'green' : domain.status === 'atencao' ? 'amber' : domain.status === 'critico' ? 'red' : 'blue';

            return (
              <div id={domain.id} key={domain.id} className="leads-domain-card">
                <div className="leads-card-actions">
                  <button className="leads-ghost-button" onClick={() => editDomain(domain)} type="button">Editar</button>
                  <button className="leads-danger-button" onClick={() => removeDomain(domain.id!)} type="button">Excluir</button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h3>{domain.dominio}</h3>
                  <span className={`leads-badge leads-badge--${domain.status}`}>{domain.status}</span>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--leads-muted)', fontFamily: 'var(--fbr-font-code, monospace)' }}>
                  {phaseLabels[domain.warming_phase]} · Dia {domain.warming_dia} · {phaseLimits[domain.warming_phase]}
                </div>

                <div className="leads-domain-stats">
                  <div>
                    <span>Bounce Rate</span>
                    <strong style={{ color: domain.bounce_rate > 2 ? 'var(--red)' : domain.bounce_rate > 1 ? 'var(--amber)' : 'var(--green)' }}>
                      {domain.bounce_rate}%
                    </strong>
                  </div>
                  <div>
                    <span>Open Rate</span>
                    <strong>{domain.open_rate}%</strong>
                  </div>
                  <div>
                    <span>Envios 7d</span>
                    <strong>{domain.total_envios_7d}</strong>
                  </div>
                </div>

                <div style={{ fontSize: '0.78rem', color: 'var(--leads-muted)', marginBottom: '4px' }}>
                  Envios hoje: {domain.envios_hoje}/{domain.limite_diario} ({pct}%)
                </div>
                <div className="leads-domain-bar">
                  <div className={`leads-domain-bar-fill leads-domain-bar-fill--${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>

                <div className="leads-domain-checks">
                  <span className={domain.spf_ok ? 'ok' : 'nok'}>SPF {domain.spf_ok ? 'OK' : 'NOK'}</span>
                  <span className={domain.dkim_ok ? 'ok' : 'nok'}>DKIM {domain.dkim_ok ? 'OK' : 'NOK'}</span>
                  <span className={domain.dmarc_ok ? 'ok' : 'nok'}>DMARC {domain.dmarc_ok ? 'OK' : 'NOK'}</span>
                  <span className={!domain.blacklist ? 'ok' : 'nok'}>{domain.blacklist ? 'BLACKLIST' : 'Clean'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
