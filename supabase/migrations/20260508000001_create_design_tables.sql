-- Migration: Create Design Tables
-- Date: 2026-05-08
-- Story: 1.11
-- Required Design table coverage:
-- clientes -> design_clients
-- brand_kits -> design_brand_kits
-- jobs -> design_jobs
-- job_variants -> design_job_variants
-- review_packs -> design_review_packs
-- review_rule_results -> design_review_rule_results
-- templates -> design_templates
-- deliverables -> design_deliverables
-- webhook_log -> design_webhook_log
-- audit_log -> design_audit_log
-- agent_actions -> design_agent_actions
--
-- SPEC baseline mapping:
-- ds_clientes -> design_clients
-- ds_brand_kits -> design_brand_kits
-- ds_jobs -> design_jobs
-- ds_templates -> design_templates
-- ds_webhook_log -> design_webhook_log
-- ds_audit_log -> design_audit_log

CREATE TABLE design_clients (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL,
  nome              TEXT NOT NULL,
  empresa           TEXT NOT NULL,
  contato           TEXT,
  email             TEXT,
  segmento          TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'arquivado')),
  created_by        UUID,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE design_brand_kits (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL,
  client_id         UUID NOT NULL REFERENCES design_clients(id),
  nome              TEXT NOT NULL,
  versao            INT NOT NULL DEFAULT 1 CHECK (versao > 0),
  ativo             BOOLEAN NOT NULL DEFAULT TRUE,
  cores             JSONB NOT NULL,
  fontes            JSONB NOT NULL,
  guidelines        JSONB NOT NULL,
  logo_variants     JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema_version    TEXT NOT NULL DEFAULT '2.0',
  created_by        UUID,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE design_jobs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL,
  client_id         UUID NOT NULL REFERENCES design_clients(id),
  brand_kit_id      UUID NOT NULL REFERENCES design_brand_kits(id),
  nome              TEXT NOT NULL,
  objetivo          TEXT NOT NULL,
  briefing_text     TEXT NOT NULL,
  tone              TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'briefing' CHECK (status IN ('briefing', 'asset_finder', 'composicao', 'auto_review', 'render', 'ready', 'approved', 'published')),
  requested_formats JSONB NOT NULL,
  pipeline_payload  JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes             TEXT,
  approved_at       TIMESTAMPTZ,
  approved_by       UUID,
  created_by        UUID,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE design_job_variants (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL,
  job_id            UUID NOT NULL REFERENCES design_jobs(id) ON DELETE CASCADE,
  format_slug       TEXT NOT NULL,
  label             TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'review_blocked', 'ready', 'approved', 'published')),
  progress          NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  width             INT NOT NULL CHECK (width > 0),
  height            INT NOT NULL CHECK (height > 0),
  text_area_percent NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (text_area_percent >= 0 AND text_area_percent <= 100),
  metadata          JSONB NOT NULL DEFAULT '{}'::jsonb,
  rendered_url      TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE design_review_packs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL,
  job_id            UUID NOT NULL REFERENCES design_jobs(id) ON DELETE CASCADE,
  variant_id        UUID NOT NULL REFERENCES design_job_variants(id) ON DELETE CASCADE,
  overall_status    TEXT NOT NULL CHECK (overall_status IN ('approved', 'warn', 'blocked')),
  delta_e           NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (delta_e >= 0),
  review_payload    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE design_review_rule_results (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL,
  review_pack_id    UUID NOT NULL REFERENCES design_review_packs(id) ON DELETE CASCADE,
  rule_key          TEXT NOT NULL CHECK (rule_key IN ('no_links', 'no_spam_words', 'correct_proportions', 'safe_zone', 'brand_colors', 'logo_visibility', 'text_legibility', 'spam_ratio')),
  status            TEXT NOT NULL CHECK (status IN ('pass', 'warn', 'fail')),
  detail            TEXT NOT NULL,
  metric_label      TEXT,
  metric_value      TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE design_templates (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL,
  nome              TEXT NOT NULL,
  tipo              TEXT NOT NULL CHECK (tipo IN ('social', 'ads', 'identity', 'docs')),
  format_slugs      JSONB NOT NULL,
  summary           TEXT NOT NULL,
  layout_json       JSONB NOT NULL DEFAULT '{}'::jsonb,
  dynamic_tokens    JSONB NOT NULL DEFAULT '[]'::jsonb,
  publico           BOOLEAN NOT NULL DEFAULT FALSE,
  created_by        UUID,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE design_deliverables (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL,
  job_id            UUID NOT NULL REFERENCES design_jobs(id) ON DELETE CASCADE,
  variant_id        UUID NOT NULL REFERENCES design_job_variants(id) ON DELETE CASCADE,
  format            TEXT NOT NULL CHECK (format IN ('png', 'jpg', 'pdf', 'pptx', 'zip')),
  status            TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'pronto', 'aprovado', 'publicado')),
  width             INT NOT NULL CHECK (width > 0),
  height            INT NOT NULL CHECK (height > 0),
  file_url          TEXT NOT NULL,
  storage_path      TEXT NOT NULL,
  export_payload    JSONB NOT NULL DEFAULT '{}'::jsonb,
  approved_at       TIMESTAMPTZ,
  approved_by       UUID,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE design_webhook_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL,
  event             TEXT NOT NULL,
  target_system     TEXT NOT NULL,
  payload           JSONB NOT NULL,
  signature         TEXT,
  response_status   INT,
  response_body     TEXT,
  attempts          INT NOT NULL DEFAULT 1 CHECK (attempts > 0),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at      TIMESTAMPTZ
);

CREATE TABLE design_audit_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL,
  entity_type       TEXT NOT NULL CHECK (entity_type IN ('brand_kit', 'job', 'variant', 'deliverable', 'template', 'webhook')),
  entity_id         UUID NOT NULL,
  actor_type        TEXT NOT NULL CHECK (actor_type IN ('human', 'agent', 'system')),
  actor_id          TEXT NOT NULL,
  action            TEXT NOT NULL,
  before_value      JSONB,
  after_value       JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE design_agent_actions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL,
  agent_id          TEXT NOT NULL,
  agent_slot        TEXT NOT NULL CHECK (agent_slot IN ('compositor', 'asset_finder', 'revisor')),
  action_type       TEXT NOT NULL,
  confidence        NUMERIC(5,2) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 100)),
  result            TEXT,
  payload           JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_design_clients_company_id ON design_clients(company_id);
CREATE INDEX idx_design_brand_kits_company_id ON design_brand_kits(company_id);
CREATE INDEX idx_design_brand_kits_client_id ON design_brand_kits(client_id);
CREATE INDEX idx_design_jobs_company_id ON design_jobs(company_id);
CREATE INDEX idx_design_jobs_brand_kit_id ON design_jobs(brand_kit_id);
CREATE INDEX idx_design_job_variants_job_id ON design_job_variants(job_id);
CREATE INDEX idx_design_review_packs_job_id ON design_review_packs(job_id);
CREATE INDEX idx_design_review_rule_results_pack_id ON design_review_rule_results(review_pack_id);
CREATE INDEX idx_design_templates_company_id ON design_templates(company_id);
CREATE INDEX idx_design_deliverables_job_id ON design_deliverables(job_id);
CREATE INDEX idx_design_webhook_log_company_id ON design_webhook_log(company_id);
CREATE INDEX idx_design_audit_log_company_id ON design_audit_log(company_id);
CREATE INDEX idx_design_agent_actions_company_id ON design_agent_actions(company_id);
