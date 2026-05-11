'use client';

import { useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import type { Lead, PipelineStage } from '@/lib/leads/types';
import { requestJson } from './api';

const fonteLabels: Record<string, string> = {
  linkedin: 'LinkedIn',
  cnpj_biz: 'CNPJ.biz',
  google_maps: 'Google Maps',
  site: 'Site',
  manual: 'Manual',
};

const stageColors = ['blue', 'sky', 'violet', 'amber', 'orange', 'teal', 'green', 'slate'];

const navItems = [
  { href: '/leads', label: 'Overview' },
  { href: '/leads/pipeline', label: 'Pipeline' },
  { href: '/leads/domains', label: 'Dominios' },
  { href: '/leads/icp', label: 'ICP' },
  { href: '/leads/agents', label: 'Agentes' },
  { href: '/leads/campaigns', label: 'Campanhas' },
  { href: '/leads/reports', label: 'Relatorios' },
];

function emptyStageDraft() {
  return { nome: '', descricao: '', cor: 'sky' };
}

export function LeadsPipeline({
  initialLeads,
  initialStages,
}: {
  initialLeads: Lead[];
  initialStages: PipelineStage[];
}) {
  const [leads, setLeads] = useState(initialLeads);
  const [stages, setStages] = useState(initialStages);
  const [busca, setBusca] = useState('');
  const [selectedStageIds, setSelectedStageIds] = useState<string[]>([]);
  const [selectedFontes, setSelectedFontes] = useState<string[]>([]);
  const [stageDraft, setStageDraft] = useState(emptyStageDraft());
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fontes = Object.keys(fonteLabels);

  const filtered = useMemo(() => {
    return leads.filter((lead) => {
      if (busca) {
        const q = busca.toLowerCase();
        if (
          !lead.contato_nome.toLowerCase().includes(q) &&
          !lead.empresa_nome.toLowerCase().includes(q) &&
          !(lead.contato_email?.toLowerCase().includes(q))
        ) {
          return false;
        }
      }
      if (selectedStageIds.length > 0 && !selectedStageIds.includes(lead.etapa)) return false;
      if (selectedFontes.length > 0 && !selectedFontes.includes(lead.fonte)) return false;
      return true;
    });
  }, [busca, leads, selectedFontes, selectedStageIds]);

  const stageCounts = useMemo(
    () => stages.map((stage) => ({ ...stage, count: leads.filter((lead) => lead.etapa === stage.id).length })),
    [leads, stages],
  );

  function toggleStageFilter(stageId: string) {
    setSelectedStageIds((current) =>
      current.includes(stageId) ? current.filter((item) => item !== stageId) : [...current, stageId],
    );
  }

  function toggleFontFilter(fonte: string) {
    setSelectedFontes((current) =>
      current.includes(fonte) ? current.filter((item) => item !== fonte) : [...current, fonte],
    );
  }

  async function saveStage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (editingStageId) {
        const payload = await requestJson<{ stage: PipelineStage }>('/api/proxy/leads/pipeline-stages', {
          method: 'PATCH',
          body: JSON.stringify({ id: editingStageId, ...stageDraft }),
        });
        setStages((current) => current.map((stage) => (stage.id === payload.stage.id ? payload.stage : stage)));
      } else {
        const payload = await requestJson<{ stage: PipelineStage }>('/api/proxy/leads/pipeline-stages', {
          method: 'POST',
          body: JSON.stringify(stageDraft),
        });
        setStages((current) => [...current, payload.stage].sort((left, right) => left.ordem - right.ordem));
      }

      setStageDraft(emptyStageDraft());
      setEditingStageId(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível salvar a etapa.');
    } finally {
      setSaving(false);
    }
  }

  async function updateLeadStage(leadId: string, etapa: string) {
    setError(null);

    try {
      const payload = await requestJson<{ lead: Lead }>('/api/proxy/leads/leads', {
        method: 'PATCH',
        body: JSON.stringify({ id: leadId, etapa }),
      });
      setLeads((current) => current.map((lead) => (lead.id === payload.lead.id ? payload.lead : lead)));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível mover o lead.');
    }
  }

  function startEditing(stage: PipelineStage) {
    setEditingStageId(stage.id);
    setStageDraft({ nome: stage.nome, descricao: stage.descricao ?? '', cor: stage.cor });
  }

  return (
    <main className="leads-shell">
      <section className="leads-hero leads-hero--compact">
        <div>
          <p>FBR-Leads</p>
          <h1>Pipeline de Leads</h1>
          <span>Edite etapas do funil e reposicione leads sem sair do modulo.</span>
        </div>
      </section>

      <nav className="leads-nav-tabs">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} data-active={item.href === '/leads/pipeline' ? 'true' : undefined}>
            {item.label}
          </Link>
        ))}
      </nav>

      <section className="leads-section" aria-label="Configuracao de etapas">
        <header>
          <div>
            <p>Etapas</p>
            <h2>Mapa do pipeline</h2>
          </div>
        </header>

        <div className="leads-stage-grid">
          {stageCounts.map((stage, index) => (
            <article key={stage.id} className="leads-stage-card">
              <div className="leads-stage-card__header">
                <span className={`leads-stage-chip leads-stage-chip--${stage.cor}`}>{String(index + 1).padStart(2, '0')}</span>
                <button className="leads-ghost-button" onClick={() => startEditing(stage)} type="button">Editar</button>
              </div>
              <h3>{stage.nome}</h3>
              <p>{stage.descricao ?? 'Sem descrição operacional.'}</p>
              <strong>{stage.count} leads</strong>
            </article>
          ))}
        </div>

        <form className="leads-form-card" onSubmit={saveStage}>
          <div className="leads-form-card__header">
            <div>
              <p>{editingStageId ? 'Edicao' : 'Nova etapa'}</p>
              <h3>{editingStageId ? 'Atualizar etapa' : 'Criar etapa adicional'}</h3>
            </div>
            {editingStageId && (
              <button
                className="leads-ghost-button"
                onClick={() => {
                  setEditingStageId(null);
                  setStageDraft(emptyStageDraft());
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
              <input
                onChange={(event) => setStageDraft((current) => ({ ...current, nome: event.target.value }))}
                value={stageDraft.nome}
              />
            </label>
            <label>
              <span>Cor</span>
              <select
                onChange={(event) => setStageDraft((current) => ({ ...current, cor: event.target.value }))}
                value={stageDraft.cor}
              >
                {stageColors.map((color) => (
                  <option key={color} value={color}>{color}</option>
                ))}
              </select>
            </label>
            <label className="leads-form-grid__full">
              <span>Descricao</span>
              <textarea
                onChange={(event) => setStageDraft((current) => ({ ...current, descricao: event.target.value }))}
                rows={3}
                value={stageDraft.descricao}
              />
            </label>
          </div>

          {error && <p className="leads-form-error">{error}</p>}
          <button disabled={saving} type="submit">{saving ? 'Salvando...' : editingStageId ? 'Atualizar etapa' : 'Criar etapa'}</button>
        </form>
      </section>

      <section className="leads-section" aria-label="Pipeline de leads">
        <header>
          <div>
            <p>Operacao</p>
            <h2>{filtered.length} leads encontrados</h2>
          </div>
        </header>

        <div className="leads-filters">
          <input
            aria-label="Buscar lead"
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Buscar por nome, empresa ou e-mail..."
            value={busca}
          />
        </div>

        <div className="leads-status-filter" style={{ marginBottom: '12px' }}>
          {stages.map((stage) => (
            <button
              key={stage.id}
              aria-pressed={selectedStageIds.includes(stage.id)}
              onClick={() => toggleStageFilter(stage.id)}
              type="button"
            >
              {stage.nome}
            </button>
          ))}
        </div>

        <div className="leads-status-filter">
          {fontes.map((fonte) => (
            <button
              key={fonte}
              aria-pressed={selectedFontes.includes(fonte)}
              onClick={() => toggleFontFilter(fonte)}
              type="button"
            >
              {fonteLabels[fonte]}
            </button>
          ))}
        </div>

        <div className="leads-table-wrap" style={{ marginTop: '16px' }}>
          <table className="leads-table">
            <thead>
              <tr>
                <th scope="col">Contato</th>
                <th scope="col">Empresa</th>
                <th scope="col">Cargo</th>
                <th scope="col">Score</th>
                <th scope="col">Etapa</th>
                <th scope="col">Fonte</th>
                <th scope="col">E-mail</th>
                <th scope="col">ICP</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="leads-empty">Nenhum lead encontrado.</td></tr>
              )}
              {filtered.map((lead) => (
                <tr key={lead.id}>
                  <td style={{ color: 'var(--fbr-white, #EEF4FF)', fontWeight: 600 }}>{lead.contato_nome}</td>
                  <td>{lead.empresa_nome}</td>
                  <td>{lead.contato_cargo ?? '-'}</td>
                  <td>
                    <span className={`leads-score leads-score--${lead.score >= 80 ? 'high' : lead.score >= 50 ? 'medium' : 'low'}`}>
                      {lead.score}
                    </span>
                  </td>
                  <td>
                    <select
                      className="leads-inline-select"
                      onChange={(event) => updateLeadStage(lead.id!, event.target.value)}
                      value={lead.etapa}
                    >
                      {stages.map((stage) => (
                        <option key={stage.id} value={stage.id}>{stage.nome}</option>
                      ))}
                    </select>
                  </td>
                  <td>{fonteLabels[lead.fonte] ?? lead.fonte}</td>
                  <td style={{ fontSize: '0.78rem' }}>{lead.contato_email ?? '-'}</td>
                  <td style={{ fontSize: '0.78rem' }}>{lead.icp_id ? 'Vinculado' : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
