'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AgentPicker } from '@fbr/ui';
import type { ArvaAgent } from '@fbr/arva-integration';
import type {
  BrandKit,
  DesignAgentSlot,
  DesignDashboardKpis,
  DesignFormat,
  DesignJob,
  DesignReviewPack,
  DesignTemplate,
  DesignWebhookPreview,
  Deliverable,
} from '@/lib/design/types';
import styles from './DesignDashboard.module.css';

const categoryLabels: Record<string, string> = {
  social_media: 'Social Media',
  digital_ads: 'Digital Ads',
  identidade_visual: 'Identidade Visual',
  documentos: 'Documentos',
};

const stageLabels: Record<DesignJob['status'], string> = {
  briefing: 'Briefing',
  asset_finder: 'Asset Finder',
  composicao: 'Composicao',
  auto_review: 'Auto-Review',
  render: 'Render',
  ready: 'Deliver',
  approved: 'Approved',
  published: 'Published',
};

const slotTags = ['design', 'criativo', 'branding'];

export function DesignDashboard({
  initialKpis,
  initialJobs,
  initialBrandKits,
  initialFormats,
  initialTemplates,
  initialAgentSlots,
  initialDeliverables,
  initialReviewPacks,
  availableAgents,
  webhookPreviews,
}: {
  initialKpis: DesignDashboardKpis;
  initialJobs: DesignJob[];
  initialBrandKits: BrandKit[];
  initialFormats: DesignFormat[];
  initialTemplates: DesignTemplate[];
  initialAgentSlots: DesignAgentSlot[];
  initialDeliverables: Deliverable[];
  initialReviewPacks: DesignReviewPack[];
  availableAgents: ArvaAgent[];
  webhookPreviews: Record<string, DesignWebhookPreview>;
}) {
  const [selectedBrandKitId, setSelectedBrandKitId] = useState(initialBrandKits[0]?.id ?? '');
  const [selectedJobId, setSelectedJobId] = useState(initialJobs[0]?.id ?? '');
  const [linkedAgents, setLinkedAgents] = useState(availableAgents.slice(0, 3));

  const brandKit = initialBrandKits.find((item) => item.id === selectedBrandKitId) ?? initialBrandKits[0];
  const selectedJob = initialJobs.find((item) => item.id === selectedJobId) ?? initialJobs[0];
  const brandKitKey = brandKit?.id ?? '';
  const activeWebhook = brandKitKey ? webhookPreviews[brandKitKey] : undefined;
  const selectedDeliverables = useMemo(
    () => initialDeliverables.filter((item) => item.job_id === selectedJob?.id),
    [initialDeliverables, selectedJob],
  );
  const reviewPacks = useMemo(
    () => initialReviewPacks.filter((item) => item.job_id === selectedJob?.id),
    [initialReviewPacks, selectedJob],
  );
  const activeReview = reviewPacks[0];

  const groupedFormats = useMemo(() => {
    return initialFormats.reduce<Record<string, DesignFormat[]>>((acc, format) => {
      acc[format.category] = [...(acc[format.category] ?? []), format];
      return acc;
    }, {});
  }, [initialFormats]);

  return (
    <main className={styles.designShell}>
      <nav className="module-breadcrumb">
        <Link href="/">Portal</Link> / <span>Design</span>
      </nav>

      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>FBR-Design</p>
          <h1>Graphic design as infrastructure</h1>
          <span>
            Brand kits, asset cascade, auto-review and export pipelines aligned to Sales, Social and MKT handoffs.
          </span>
        </div>

        <div className={styles.heroActions}>
          <AgentPicker
            agents={availableAgents}
            companyId="empresa-1"
            linkedAgents={linkedAgents}
            moduleId="design"
            moduleTags={slotTags}
            onSelect={({ agent }) =>
              setLinkedAgents((current) => (current.some((item) => item.id === agent.id) ? current : [...current, agent]))
            }
            triggerLabel="Incluir Agente"
          />
          <div className={styles.heroNotes}>
            <strong>3 slots ativos</strong>
            <span>Compositor, Asset Finder e Revisor prontos para operar na Arva Platform.</span>
          </div>
        </div>
      </section>

      <section className={styles.kpiGrid} aria-label="KPIs Design">
        <KpiCard label="Clientes ativos" value={String(initialKpis.clientes_ativos)} detail="contas com brand kit ativo" />
        <KpiCard label="Brand kits" value={String(initialKpis.brand_kits_ativos)} detail="fonte de verdade para Social" />
        <KpiCard label="Jobs ativos" value={String(initialKpis.jobs_ativos)} detail="fila em briefing/composicao/review" />
        <KpiCard label="Artes prontas" value={String(initialKpis.artes_prontas)} detail="variants aprovadas ou publicadas" />
        <KpiCard label="Taxa de aprovacao" value={`${initialKpis.taxa_aprovacao}%`} detail="revisoes sem bloqueio" />
        <KpiCard label="Formatos" value={String(initialKpis.formatos_catalogados)} detail="catalogo exato do PRD" />
        <KpiCard label="Templates" value={String(initialKpis.templates_ativos)} detail="reuso para Social/Docs/Ads" />
      </section>

      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>DS-V03</p>
            <h2>Catalogo de formatos</h2>
          </div>
          <small>Social Media, Digital Ads, Identidade e Documentos em um mesmo catalogo operacional.</small>
        </header>
        <div className={styles.formatGrid}>
          {Object.entries(groupedFormats).map(([category, formats]) => (
            <article key={category} className={styles.formatCard}>
              <h3>{categoryLabels[category] ?? category}</h3>
              <ul>
                {formats.slice(0, 6).map((format) => (
                  <li key={format.slug}>
                    <span>{format.name}</span>
                    <strong>
                      {format.width}x{format.height}
                    </strong>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>DS-V04</p>
            <h2>Pipeline inteligente</h2>
          </div>
          <small>Briefing / Brand kit lookup / Asset finder / composicao / auto-review / render / deliver.</small>
        </header>
        <div className={styles.pipeline}>
          <PipelineCard index="01" title="Interpretacao do briefing" body="Schema validado, formatos solicitados e tom de voz definidos antes de gerar qualquer pixel." />
          <PipelineCard index="02" title="Asset Finder e geracao" body={"Cascade Unsplash -> Pexels -> Pixabay -> MidJourney com timeout, cache e fallback."} />
          <PipelineCard index="03" title="Composicao, review e export" body="Pillow aplica o brand kit, revisor executa 8 regras e exporter abre PNG/JPG/PDF/PPTX/ZIP." />
        </div>
      </section>

      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>DS-C01</p>
            <h2>Brand kit editor</h2>
          </div>
          <select
            aria-label="Selecionar brand kit"
            className={styles.select}
            onChange={(event) => setSelectedBrandKitId(event.target.value)}
            value={selectedBrandKitId}
          >
            {initialBrandKits.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nome}
              </option>
            ))}
          </select>
        </header>
        {brandKit && (
          <div className={styles.brandKitLayout}>
            <article className={styles.brandKitCard}>
              <h3>{brandKit.nome}</h3>
              <p>{brandKit.empresa}</p>
              <div className={styles.colorGrid}>
                {Object.entries(brandKit.cores).map(([token, value]) =>
                  value ? (
                    <div className={styles.colorToken} key={token}>
                      <span style={{ backgroundColor: value }} />
                      <strong>{token}</strong>
                      <small>{value}</small>
                    </div>
                  ) : null,
                )}
              </div>
            </article>

            <article className={styles.brandKitCard}>
              <h3>Tipografia e guidelines</h3>
              <div className={styles.fontStack}>
                <div>
                  <strong>{brandKit.fontes.heading.family}</strong>
                  <span>Heading / {brandKit.fontes.heading.weight}</span>
                </div>
                <div>
                  <strong>{brandKit.fontes.body.family}</strong>
                  <span>Body / {brandKit.fontes.body.weight}</span>
                </div>
                {brandKit.fontes.accent ? (
                  <div>
                    <strong>{brandKit.fontes.accent.family}</strong>
                    <span>Accent / {brandKit.fontes.accent.weight}</span>
                  </div>
                ) : null}
              </div>
              <ul className={styles.guidelines}>
                <li>Logo minimo: {brandKit.guidelines.logo_min_size_px}px</li>
                <li>Safe clear space: {brandKit.guidelines.logo_clear_space_px}px</li>
                <li>Tom: {brandKit.guidelines.tone_of_voice}</li>
                <li>Max text area: {brandKit.guidelines.max_text_area_percent}%</li>
              </ul>
            </article>

            <article className={styles.brandKitCard}>
              <h3>Webhook FBR-Social</h3>
              <p>Contrato unificado `brand_kit.updated` com assinatura HMAC-SHA256.</p>
              {activeWebhook ? (
                <div className={styles.webhookCard}>
                  <strong>{activeWebhook.event}</strong>
                  <small>changed_fields: {activeWebhook.payload.changed_fields.join(', ')}</small>
                  <code>{activeWebhook.signature.slice(0, 22)}...</code>
                </div>
              ) : null}
              <div className={styles.logoTags}>
                {Object.entries(brandKit.logo_variants).map(([key, value]) =>
                  value ? (
                    <span key={key} className={styles.badge}>
                      {key}
                    </span>
                  ) : null,
                )}
              </div>
            </article>
          </div>
        )}
      </section>

      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>DS-C02</p>
            <h2>Job builder e fila</h2>
          </div>
          <select
            aria-label="Selecionar job"
            className={styles.select}
            onChange={(event) => setSelectedJobId(event.target.value)}
            value={selectedJobId}
          >
            {initialJobs.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nome}
              </option>
            ))}
          </select>
        </header>

        <div className={styles.jobsLayout}>
          <article className={styles.jobsCard}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Cliente</th>
                  <th>Status</th>
                  <th>Formatos</th>
                </tr>
              </thead>
              <tbody>
                {initialJobs.map((job) => (
                  <tr key={job.id}>
                    <td>{job.nome}</td>
                    <td>{job.cliente_nome}</td>
                    <td>
                      <span className={styles.badge}>{stageLabels[job.status]}</span>
                    </td>
                    <td>{job.requested_formats.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>

          {selectedJob ? (
            <article className={styles.jobsCard}>
              <h3>{selectedJob.nome}</h3>
              <p>{selectedJob.briefing_text}</p>
              <div className={styles.metaList}>
                <div>
                  <strong>Objetivo</strong>
                  <span>{selectedJob.objetivo}</span>
                </div>
                <div>
                  <strong>Tom</strong>
                  <span>{selectedJob.tone}</span>
                </div>
                <div>
                  <strong>Formatos</strong>
                  <span>{selectedJob.requested_formats.join(', ')}</span>
                </div>
              </div>
            </article>
          ) : null}
        </div>
      </section>

      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>DS-C03 + DS-C04</p>
            <h2>Render pipeline e auto-review</h2>
          </div>
          <small>Progress por variante, safe zone, proporcao, Delta E e export gate na mesma superficie.</small>
        </header>

        {selectedJob ? (
          <div className={styles.pipelineLayout}>
            <article className={styles.reviewCard}>
              <h3>Pipeline por variante</h3>
              <div className={styles.variantList}>
                {selectedJob.variants.map((variant) => (
                  <div className={styles.variantCard} key={variant.id}>
                    <div className={styles.variantHeader}>
                      <strong>{variant.label}</strong>
                      <span className={styles.badge}>{variant.status}</span>
                    </div>
                    <small>{variant.format_slug}</small>
                    <div className={styles.progressBar}>
                      <span style={{ width: `${variant.progress}%` }} />
                    </div>
                    <p>{variant.headline}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className={styles.reviewCard}>
              <h3>Auto-review dashboard</h3>
              {activeReview ? (
                <>
                  <div className={styles.reviewSummary}>
                    <strong>{activeReview.overall_status.toUpperCase()}</strong>
                    <span>Delta E {activeReview.delta_e.toFixed(1)}</span>
                  </div>
                  <div className={styles.ruleGrid}>
                    {activeReview.rules.map((rule) => (
                      <div className={styles.ruleCard} key={rule.key}>
                        <strong>{rule.key}</strong>
                        <span className={styles[`rule_${rule.status}`]}>{rule.status}</span>
                        <p>{rule.detail}</p>
                        {rule.metric_label && rule.metric_value ? (
                          <small>
                            {rule.metric_label}: {rule.metric_value}
                          </small>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p>Nenhuma revisao calculada.</p>
              )}
            </article>
          </div>
        ) : null}
      </section>

      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>DS-C05</p>
            <h2>Galeria, export e templates</h2>
          </div>
          <small>PNG/JPG/PDF/PPTX/ZIP para entregar criativos e documentos sem sair do modulo.</small>
        </header>
        <div className={styles.exportLayout}>
          <article className={styles.reviewCard}>
            <h3>Deliverables</h3>
            <div className={styles.deliverableGrid}>
              {selectedDeliverables.map((item) => (
                <div className={styles.deliverableCard} key={item.id}>
                  <strong>{item.format.toUpperCase()}</strong>
                  <span>{item.width}x{item.height}</span>
                  <small>{item.status}</small>
                </div>
              ))}
            </div>
          </article>

          <article className={styles.reviewCard}>
            <h3>Templates ativos</h3>
            <div className={styles.templateList}>
              {initialTemplates.map((template) => (
                <div className={styles.templateCard} key={template.id}>
                  <strong>{template.nome}</strong>
                  <span>{template.summary}</span>
                  <small>{template.format_slugs.join(', ')}</small>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>DS-V05 + DS-A01</p>
            <h2>Painel de agentes</h2>
          </div>
          <small>3 slots Arva com status operacional e log de atividade do pipeline.</small>
        </header>
        <div className={styles.agentsLayout}>
          <div className={styles.agentGrid} aria-label="Slots de agentes Design">
            {initialAgentSlots.map((slot) => (
              <article className={styles.agentCard} key={slot.slot}>
                <span className={styles.badge}>{slot.slot}</span>
                <h3>{slot.title}</h3>
                <p>{slot.description}</p>
                <small>
                  {slot.status} / {slot.model}
                </small>
              </article>
            ))}
          </div>

          <div className={styles.logCard} aria-label="Log de agentes Design">
            {linkedAgents.length > 0 ? (
              <div className={styles.linkedAgents}>
                {linkedAgents.slice(0, 3).map((agent) => (
                  <span className={styles.linkedAgent} key={agent.id}>
                    {agent.name}
                  </span>
                ))}
              </div>
            ) : null}
            <div className={styles.logList}>
              {activeWebhook ? (
                <div className={styles.logLine}>
                  <span>Webhook</span>
                  <p>brand_kit.updated ready for {activeWebhook.payload.cliente_nome}.</p>
                </div>
              ) : null}
              {initialAgentSlots.map((slot) => (
                <div className={styles.logLine} key={slot.slot}>
                  <span>{slot.title}</span>
                  <p>{slot.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function KpiCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className={styles.kpiCard}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function PipelineCard({ index, title, body }: { index: string; title: string; body: string }) {
  return (
    <article className={styles.pipelineCard}>
      <strong>{index}</strong>
      <h3>{title}</h3>
      <p>{body}</p>
    </article>
  );
}
