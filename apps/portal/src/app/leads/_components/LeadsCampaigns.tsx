'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import type { Campaign, Domain, ICP } from '@/lib/leads/types';
import type { Campaign as MktCampaign } from '@/lib/mkt/types';
import { requestJson } from './api';

const statusLabels: Record<string, string> = {
  rascunho: 'Rascunho',
  ativa: 'Ativa',
  pausada: 'Pausada',
  concluida: 'Concluida',
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
    nome: '',
    descricao: '',
    status: 'rascunho',
    icp_id: '',
    dominio_id: '',
    mkt_campaign_id: '',
  };
}

function defaultCadencia() {
  return [
    { toque: 1, dia: 0, horario_inicio: '09:00', horario_fim: '11:00' },
    { toque: 2, dia: 4, horario_inicio: '14:00', horario_fim: '16:00' },
    { toque: 3, dia: 9, horario_inicio: '10:00', horario_fim: '12:00' },
    { toque: 4, dia: 16, horario_inicio: '09:00', horario_fim: '11:00' },
  ];
}

export function LeadsCampaigns({
  campaigns: initialCampaigns,
  domains,
  icps,
  mktCampaigns,
}: {
  campaigns: Campaign[];
  domains: Domain[];
  icps: ICP[];
  mktCampaigns: MktCampaign[];
}) {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [draft, setDraft] = useState(emptyDraft());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const linkedMktCampaign = mktCampaigns.find((campaign) => campaign.id === draft.mkt_campaign_id);
    const payloadBase = {
      nome: draft.nome,
      descricao: draft.descricao,
      status: draft.status,
      icp_id: draft.icp_id || undefined,
      dominio_id: draft.dominio_id || undefined,
      mkt_campaign_id: linkedMktCampaign?.id,
      mkt_campaign_nome: linkedMktCampaign?.nome,
      mkt_responsavel: linkedMktCampaign?.responsavel,
      mkt_canal: linkedMktCampaign?.canal,
      cadencia_config: defaultCadencia(),
    };

    try {
      if (editingId) {
        const payload = await requestJson<{ campaign: Campaign }>('/api/proxy/leads/campaigns', {
          method: 'PATCH',
          body: JSON.stringify({ id: editingId, ...payloadBase }),
        });
        setCampaigns((current) => current.map((campaign) => (campaign.id === payload.campaign.id ? payload.campaign : campaign)));
      } else {
        const payload = await requestJson<{ campaign: Campaign }>('/api/proxy/leads/campaigns', {
          method: 'POST',
          body: JSON.stringify(payloadBase),
        });
        setCampaigns((current) => [payload.campaign, ...current]);
      }

      setEditingId(null);
      setDraft(emptyDraft());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível salvar a campanha.');
    } finally {
      setSaving(false);
    }
  }

  async function removeCampaign(id: string) {
    setError(null);
    try {
      await requestJson('/api/proxy/leads/campaigns', {
        method: 'DELETE',
        body: JSON.stringify({ id }),
      });
      setCampaigns((current) => current.filter((campaign) => campaign.id !== id));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível excluir a campanha.');
    }
  }

  function editCampaign(campaign: Campaign) {
    setEditingId(campaign.id!);
    setDraft({
      nome: campaign.nome,
      descricao: campaign.descricao ?? '',
      status: campaign.status,
      icp_id: campaign.icp_id ?? '',
      dominio_id: campaign.dominio_id ?? '',
      mkt_campaign_id: campaign.mkt_campaign_id ?? '',
    });
  }

  return (
    <main className="leads-shell">
      <section className="leads-hero leads-hero--compact">
        <div>
          <p>FBR-Leads</p>
          <h1>Campanhas</h1>
          <span>Gerencie campanhas outbound e vincule cada uma a uma estrategia definida no FBR-MKT.</span>
        </div>
      </section>

      <nav className="leads-nav-tabs">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} data-active={item.href === '/leads/campaigns' ? 'true' : undefined}>
            {item.label}
          </Link>
        ))}
      </nav>

      <section className="leads-section" aria-label="Integracao com FBR-MKT">
        <header>
          <div>
            <p>Integracao</p>
            <h2>Campanhas vindas do FBR-MKT</h2>
          </div>
        </header>
        <div className="leads-mini-grid leads-mini-grid--wide">
          {mktCampaigns.map((campaign) => (
            <article key={campaign.id} className="leads-mini-card">
              <strong>{campaign.nome}</strong>
              <span>{campaign.canal}</span>
              <small>{campaign.tipo} · {campaign.responsavel}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="leads-section" aria-label="Campanhas">
        <header>
          <div>
            <p>Outbound</p>
            <h2>{campaigns.length} Campanhas</h2>
          </div>
        </header>

        <form className="leads-form-card" onSubmit={submit}>
          <div className="leads-form-card__header">
            <div>
              <p>{editingId ? 'Edicao' : 'Nova campanha'}</p>
              <h3>{editingId ? 'Alterar campanha' : 'Adicionar campanha'}</h3>
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
              <span>Status</span>
              <select onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))} value={draft.status}>
                <option value="rascunho">rascunho</option>
                <option value="ativa">ativa</option>
                <option value="pausada">pausada</option>
                <option value="concluida">concluida</option>
              </select>
            </label>
            <label>
              <span>ICP</span>
              <select onChange={(event) => setDraft((current) => ({ ...current, icp_id: event.target.value }))} value={draft.icp_id}>
                <option value="">Selecionar</option>
                {icps.map((icp) => (
                  <option key={icp.id} value={icp.id}>{icp.nome}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Dominio</span>
              <select onChange={(event) => setDraft((current) => ({ ...current, dominio_id: event.target.value }))} value={draft.dominio_id}>
                <option value="">Selecionar</option>
                {domains.map((domain) => (
                  <option key={domain.id} value={domain.id}>{domain.dominio}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Campanha FBR-MKT</span>
              <select onChange={(event) => setDraft((current) => ({ ...current, mkt_campaign_id: event.target.value }))} value={draft.mkt_campaign_id}>
                <option value="">Sem vinculo</option>
                {mktCampaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>{campaign.nome}</option>
                ))}
              </select>
            </label>
            <label className="leads-form-grid__full">
              <span>Descricao</span>
              <textarea onChange={(event) => setDraft((current) => ({ ...current, descricao: event.target.value }))} rows={3} value={draft.descricao} />
            </label>
          </div>

          {error && <p className="leads-form-error">{error}</p>}
          <button disabled={saving} type="submit">{saving ? 'Salvando...' : editingId ? 'Atualizar campanha' : 'Adicionar campanha'}</button>
        </form>

        {campaigns.length === 0 && (
          <div className="leads-empty">Nenhuma campanha encontrada.</div>
        )}

        <div className="leads-campaign-grid">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="leads-campaign-card">
              <div className="leads-card-actions">
                <button className="leads-ghost-button" onClick={() => editCampaign(campaign)} type="button">Editar</button>
                <button className="leads-danger-button" onClick={() => removeCampaign(campaign.id!)} type="button">Excluir</button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>{campaign.nome}</h3>
                <span className={`leads-badge leads-badge--${campaign.status}`}>{statusLabels[campaign.status]}</span>
              </div>

              {campaign.descricao && <p className="campaign-desc">{campaign.descricao}</p>}

              <div className="leads-campaign-metrics">
                <div>
                  <span>Leads</span>
                  <strong>{campaign.total_leads}</strong>
                </div>
                <div>
                  <span>Qualificados</span>
                  <strong>{campaign.leads_qualificados}</strong>
                </div>
                <div>
                  <span>Abertura</span>
                  <strong>{campaign.taxa_abertura}%</strong>
                </div>
                <div>
                  <span>Resposta</span>
                  <strong>{campaign.taxa_resposta}%</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.78rem', color: 'var(--leads-muted)', fontFamily: 'var(--fbr-font-code, monospace)' }}>
                <span>Clique: <strong style={{ color: 'var(--leads-muted-light)' }}>{campaign.taxa_clique}%</strong></span>
                <span>Bounce: <strong style={{ color: campaign.bounce_rate > 2 ? 'var(--red)' : 'var(--leads-muted-light)' }}>{campaign.bounce_rate}%</strong></span>
                {campaign.mkt_campaign_nome && <span>FBR-MKT: <strong style={{ color: 'var(--sky)' }}>{campaign.mkt_campaign_nome}</strong></span>}
              </div>

              {campaign.cadencia_config.length > 0 && (
                <div className="leads-cadencia-timeline">
                  {campaign.cadencia_config.map((step) => (
                    <div key={step.toque} className="leads-cadencia-step">
                      <strong>Toque {step.toque}</strong>
                      <span>Dia {step.dia}</span>
                      <span>{step.horario_inicio}-{step.horario_fim}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="leads-campaign-linkages">
                {campaign.mkt_responsavel && <span>Estrategia: {campaign.mkt_responsavel}</span>}
                {campaign.mkt_canal && <span>Canal origem: {campaign.mkt_canal}</span>}
              </div>

              <div style={{ marginTop: '10px', fontSize: '0.72rem', color: 'var(--leads-muted)' }}>
                Criada em: {campaign.created_at ? new Date(campaign.created_at).toLocaleDateString('pt-BR') : '-'}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
