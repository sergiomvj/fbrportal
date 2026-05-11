'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AgentPicker } from '@fbr/ui';
import { arvaSocialAgents } from '@/lib/social/constants';
import type { BrandKitCacheEntry, SocialDashboardSnapshot, SocialNetwork } from '@/lib/social/types';

const socialAgentTags = ['social media', 'design', 'conteudo visual'];

const networkLabels: Record<SocialNetwork, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  twitter_x: 'Twitter/X',
  youtube: 'YouTube',
  pinterest: 'Pinterest',
  whatsapp: 'WhatsApp',
};

export function SocialDashboard({ initialDashboard }: { initialDashboard: SocialDashboardSnapshot }) {
  const [linkedAgents, setLinkedAgents] = useState(arvaSocialAgents.slice(0, 3));
  const [activeNetwork, setActiveNetwork] = useState<SocialNetwork | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selectedJobId, setSelectedJobId] = useState(initialDashboard.jobs[0]?.id ?? null);

  const visibleArvaAgents = useMemo(
    () => arvaSocialAgents.filter((agent) => agent.tags.some((tag) => socialAgentTags.includes(tag))),
    [],
  );

  const filteredFormats = useMemo(() => (
    activeNetwork === 'all'
      ? initialDashboard.network_matrix
      : initialDashboard.network_matrix.filter((item) => item.network === activeNetwork)
  ), [activeNetwork, initialDashboard.network_matrix]);

  const filteredJobs = useMemo(() => initialDashboard.jobs.filter((job) => {
    const matchesNetwork = activeNetwork === 'all' || job.target_networks.includes(activeNetwork);
    const matchesSearch = search.length === 0
      || `${job.product_name} ${job.headline} ${job.content_type}`.toLowerCase().includes(search.toLowerCase());
    return matchesNetwork && matchesSearch;
  }), [activeNetwork, initialDashboard.jobs, search]);

  const qualitySummary = useMemo(() => {
    const approved = initialDashboard.quality_checks.filter((item) => item.outcome === 'approved').length;
    const warning = initialDashboard.quality_checks.filter((item) => item.outcome === 'warning').length;
    const rejected = initialDashboard.quality_checks.filter((item) => item.outcome === 'rejected').length;
    return { approved, warning, rejected };
  }, [initialDashboard.quality_checks]);

  const selectedJob = initialDashboard.jobs.find((job) => job.id === selectedJobId) ?? initialDashboard.jobs[0];
  const packagePreview = null;

  const selectedBrandKit = selectedJob
    ? initialDashboard.brand_kits.find((item) => item.id === selectedJob.brand_kit_id) ?? null
    : null;

  return (
    <main className="social-shell fbr-shared-theme fbr-accent-social">
      <nav className="social-breadcrumb">
        <Link href="/">Portal</Link>
        <span>/</span>
        <span>Social</span>
      </nav>

      <section className="social-hero">
        <div className="social-hero__copy">
          <p>FBR-Social</p>
          <h1>Visual production governada por formatos reais, QA e pacote ZIP.</h1>
          <span>
            Briefing, brand kit proxy, composicao HTML/CSS, render, quality check e entrega estruturada para 8 redes.
          </span>
          <div className="social-hero__chips" aria-label="Sinais operacionais Social">
            <span>8 redes ativas</span>
            <span>30+ formatos com safe zone</span>
            <span>HTMLCSStoImage + fallback</span>
            <span>BrandSync via webhook</span>
          </div>
        </div>
        <AgentPicker
          agents={visibleArvaAgents}
          companyId="empresa-1"
          linkedAgents={linkedAgents}
          moduleId="social"
          moduleTags={socialAgentTags}
          onSelect={({ agent }) => setLinkedAgents((current) => (current.some((item) => item.id === agent.id) ? current : [...current, agent]))}
        />
      </section>

      <section aria-label="KPIs Social" className="social-kpis">
        <KpiCard label="Jobs hoje" value={String(initialDashboard.kpis.jobs_hoje)} detail="Briefings recebidos e roteados." />
        <KpiCard label="Artes geradas" value={String(initialDashboard.kpis.artes_geradas)} detail="Inclui render ready e em warning." />
        <KpiCard label="Aprovadas" value={String(initialDashboard.kpis.aprovadas)} detail="Checks completos e dentro do brand kit." />
        <KpiCard label="Pendentes" value={String(initialDashboard.kpis.pendentes)} detail="Fila, render, QA ou revisao humana." />
        <KpiCard label="Redes ativas" value={String(initialDashboard.kpis.redes_ativas)} detail="Redes tocadas pelos jobs recentes." />
        <KpiCard label="Formatos suportados" value={String(initialDashboard.kpis.formatos_suportados)} detail="Catalogo completo por rede." />
      </section>

      <section className="social-section">
        <header className="social-section__header">
          <div>
            <p>Catalogo</p>
            <h2>Grid de redes e formatos com safe zone exata</h2>
          </div>
          <div className="social-filters" role="toolbar" aria-label="Filtrar formatos por rede">
            <button aria-pressed={activeNetwork === 'all'} onClick={() => setActiveNetwork('all')} type="button">Todas</button>
            {initialDashboard.network_matrix.map((group) => (
              <button
                key={group.network}
                aria-pressed={activeNetwork === group.network}
                onClick={() => setActiveNetwork(group.network)}
                type="button"
              >
                {group.label}
              </button>
            ))}
          </div>
        </header>

        <div className="social-network-grid">
          {filteredFormats.map((group) => (
            <article className="social-network-card" key={group.network}>
              <div className="social-network-card__header">
                <h3>{group.label}</h3>
                <span>{group.format_count} formatos</span>
              </div>
              <ul>
                {group.formats.map((format) => (
                  <li key={format.slug}>
                    <strong>{format.name}</strong>
                    <span>{format.width}x{format.height} • {format.aspect_ratio}</span>
                    <small>Safe zone {format.safe_zone.width}x{format.safe_zone.height}</small>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="social-section">
        <header className="social-section__header">
          <div>
            <p>Pipeline</p>
            <h2>8 passos da producao ate o storage</h2>
          </div>
          <span className="social-pill">Briefing → Brand Kit → Templates → Assets → Composicao → Render → QA → ZIP</span>
        </header>
        <div className="social-pipeline">
          {initialDashboard.pipeline.map((step, index) => (
            <article className={`social-pipeline__step social-pipeline__step--${step.status}`} key={step.id}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h3>{step.label}</h3>
                <p>{step.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="social-section social-layout">
        <div className="social-layout__main">
          <header className="social-section__header">
            <div>
              <p>Job Builder</p>
              <h2>Briefings prontos para variar por rede e formato</h2>
            </div>
            <input
              aria-label="Buscar jobs social"
              className="social-search"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por produto, headline ou tipo..."
              value={search}
            />
          </header>

          <div className="social-job-list" aria-label="Fila de jobs Social">
            {filteredJobs.map((job) => (
              <button
                className={`social-job-card ${selectedJob?.id === job.id ? 'is-active' : ''}`}
                key={job.id}
                onClick={() => setSelectedJobId(job.id)}
                type="button"
              >
                <div className="social-job-card__top">
                  <strong>{job.product_name}</strong>
                  <span className={`social-status social-status--${job.status}`}>{job.status}</span>
                </div>
                <p>{job.headline}</p>
                <small>{job.content_type} • {job.target_networks.map((network) => networkLabels[network]).join(', ')}</small>
                <div className="social-job-card__meta">
                  <span>Fila {job.queue_position}</span>
                  <span>ETA {job.eta_minutes} min</span>
                  <span>{job.format_slugs.length} variantes</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <aside className="social-layout__side">
          {selectedJob && (
            <JobBuilderPanel
              brandKit={selectedBrandKit}
              packagePreview={packagePreview}
              selectedJobId={selectedJob.id}
              snapshot={initialDashboard}
            />
          )}
        </aside>
      </section>

      <section className="social-section social-layout">
        <div className="social-layout__main">
          <header className="social-section__header">
            <div>
              <p>Render</p>
              <h2>Pipeline UI por variante</h2>
            </div>
          </header>

          <div className="social-render-table">
            <table>
              <thead>
                <tr>
                  <th scope="col">Arquivo</th>
                  <th scope="col">Rede</th>
                  <th scope="col">Formato</th>
                  <th scope="col">Status</th>
                  <th scope="col">Dimensoes</th>
                  <th scope="col">Tamanho</th>
                </tr>
              </thead>
              <tbody>
                {initialDashboard.artefacts.map((artefact) => (
                  <tr key={artefact.id}>
                    <th scope="row">{artefact.file_name}</th>
                    <td>{networkLabels[artefact.network]}</td>
                    <td>{artefact.format_slug}</td>
                    <td><span className={`social-status social-status--${artefact.status}`}>{artefact.status}</span></td>
                    <td>{artefact.width}x{artefact.height}</td>
                    <td>{formatBytes(artefact.size_bytes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="social-layout__side">
          <header className="social-section__header">
            <div>
              <p>Quality Check</p>
              <h2>Dashboard dos 4 checks obrigatorios</h2>
            </div>
          </header>

          <div className="social-quality-summary">
            <KpiCard label="Approved" value={String(qualitySummary.approved)} detail="Dimensao, safe zone, tamanho e contraste." />
            <KpiCard label="Warning" value={String(qualitySummary.warning)} detail="Nao bloqueia, mas exige revisao humana." />
            <KpiCard label="Rejected" value={String(qualitySummary.rejected)} detail="Re-render automatico recomendado." />
          </div>

          <div className="social-quality-list">
            {initialDashboard.quality_checks.map((check) => (
              <article className={`social-quality-card social-quality-card--${check.outcome}`} key={check.id}>
                <strong>{check.outcome}</strong>
                <span>Contraste {check.contrast_ratio.toFixed(1)}:1</span>
                <p>
                  Dimensoes {check.dimensions_ok ? 'ok' : 'falhou'} • Safe zone {check.safe_zone_ok ? 'ok' : 'warning'} •
                  Tamanho {check.file_size_ok ? 'ok' : 'falhou'} • WCAG {check.contrast_ok ? 'AA' : 'abaixo'}
                </p>
                {check.notes.map((note) => <small key={note}>{note}</small>)}
              </article>
            ))}
          </div>
        </aside>
      </section>

      <section className="social-section social-layout">
        <div className="social-layout__main">
          <header className="social-section__header">
            <div>
              <p>Galeria</p>
              <h2>Deliverables e package ZIP</h2>
            </div>
          </header>

          <div className="social-gallery">
            {initialDashboard.artefacts.map((artefact) => (
              <article className="social-gallery-card" key={artefact.id}>
                <div className="social-gallery-card__thumb">
                  <span>{networkLabels[artefact.network]}</span>
                  <strong>{artefact.device_mockup}</strong>
                </div>
                <div className="social-gallery-card__meta">
                  <h3>{artefact.file_name}</h3>
                  <p>{artefact.format_slug} • {formatBytes(artefact.size_bytes)}</p>
                  <small>{artefact.file_path}</small>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="social-layout__side">
          <header className="social-section__header">
            <div>
              <p>Brand Kit Proxy</p>
              <h2>Cache e sincronizacao FBR-Design</h2>
            </div>
          </header>

          <div className="social-brand-grid">
            {initialDashboard.brand_kits.map((brandKit) => (
              <article className="social-brand-card" key={brandKit.id}>
                <strong>{brandKit.product_name}</strong>
                <span>{brandKit.stale ? 'stale' : 'fresh'} • {brandKit.source}</span>
                <div className="social-brand-card__swatches">
                  {Object.values(brandKit.palette).map((color) => <i key={color} style={{ background: color }} />)}
                </div>
                <small>{brandKit.fonts.heading} / {brandKit.fonts.body}</small>
              </article>
            ))}
          </div>
        </aside>
      </section>

      <section className="social-section social-layout">
        <div className="social-layout__main">
          <header className="social-section__header">
            <div>
              <p>Templates</p>
              <h2>Biblioteca com versionamento</h2>
            </div>
          </header>

          <div className="social-template-grid">
            {initialDashboard.templates.map((template) => (
              <article className="social-template-card" key={template.id}>
                <div className="social-template-card__top">
                  <strong>{template.name}</strong>
                  <span>v{template.version}</span>
                </div>
                <p>{networkLabels[template.network]} • {template.format_slug} • {template.content_type}</p>
                <small>{template.active ? 'Active' : 'Legacy'} • {template.config.layers.length} layers</small>
              </article>
            ))}
          </div>
        </div>

        <aside className="social-layout__side">
          <header className="social-section__header">
            <div>
              <p>Agentes</p>
              <h2>Slots e feed operacional</h2>
            </div>
          </header>

          <div aria-label="Slots de agentes Social" className="social-agent-grid">
            {initialDashboard.agent_slots.map((slot) => (
              <article className="social-agent-card" key={slot.id}>
                <strong>{slot.name}</strong>
                <span>{slot.role}</span>
                <p>{slot.summary}</p>
                <small>{slot.cadence} • {slot.status}</small>
              </article>
            ))}
          </div>

          <div className="social-event-feed">
            {initialDashboard.agent_events.map((event) => (
              <article className="social-event-card" key={event.id}>
                <strong>{event.event}</strong>
                <p>{event.message}</p>
                <small>{event.occurred_at}</small>
              </article>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}

function JobBuilderPanel({
  snapshot,
  selectedJobId,
  brandKit,
  packagePreview,
}: {
  snapshot: SocialDashboardSnapshot;
  selectedJobId: string;
  brandKit: BrandKitCacheEntry | null;
  packagePreview: { zip_name: string; manifest: import('@/lib/social/types').PackageManifest } | null;
}) {
  const selectedArtefacts = snapshot.artefacts.filter((artefact) => artefact.job_id === selectedJobId);

  return (
    <div className="social-side-stack">
      <article className="social-detail-card">
        <h3>Briefing → Variantes</h3>
        <p>{selectedArtefacts.length} entregaveis conectados ao job selecionado.</p>
        <ul>
          {selectedArtefacts.map((artefact) => (
            <li key={artefact.id}>
              <strong>{artefact.format_slug}</strong>
              <span>{networkLabels[artefact.network]} • {artefact.status}</span>
            </li>
          ))}
        </ul>
      </article>

      {brandKit && (
        <article className="social-detail-card">
          <h3>Brand kit consumido</h3>
          <p>{brandKit.product_name}</p>
          <small>{brandKit.guidelines[0]}</small>
        </article>
      )}

      {packagePreview && (
        <article className="social-detail-card">
          <h3>ZIP package</h3>
          <p>{packagePreview.zip_name}</p>
          <small>{packagePreview.manifest.total_files} arquivos • {formatBytes(packagePreview.manifest.total_size_bytes)}</small>
          <ul>
            {packagePreview.manifest.files.slice(0, 4).map((file) => (
              <li key={`${file.network}-${file.format_slug}`}>
                <strong>{file.file}</strong>
                <span>{file.dimensions}</span>
              </li>
            ))}
          </ul>
        </article>
      )}
    </div>
  );
}

function KpiCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="social-kpi-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function formatBytes(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} MB`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)} KB`;
  return `${value} B`;
}
