-- Migration: Create Social Tables
-- Date: 2026-05-08
-- Story: 1.9
-- Required Social table coverage:
-- brand_kit_cache -> social_brand_kit_cache
-- jobs -> social_jobs
-- templates -> social_templates
-- artes -> social_artes
-- quality_checks -> social_quality_checks
-- delivery_packages -> social_delivery_packages
-- agent_logs -> social_agent_logs
-- webhook_logs -> social_webhook_logs
--
-- SPEC baseline mapping:
-- brand_kit_cache -> social_brand_kit_cache
-- social_jobs -> social_jobs
-- social_templates -> social_templates
-- social_artes -> social_artes
-- social_quality_checks -> social_quality_checks
-- manifest_json -> social_delivery_packages.manifest_json
-- webhook_logs -> social_webhook_logs

CREATE TABLE social_brand_kit_cache (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL,
  product_name      TEXT NOT NULL,
  source            TEXT NOT NULL DEFAULT 'fbr-design',
  brand_payload     JSONB NOT NULL,
  stale             BOOLEAN NOT NULL DEFAULT FALSE,
  stale_reason      TEXT,
  source_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cached_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at        TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE social_jobs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL,
  product_name      TEXT NOT NULL,
  brand_kit_id      UUID NOT NULL REFERENCES social_brand_kit_cache(id),
  content_type      TEXT NOT NULL,
  tone              TEXT NOT NULL,
  headline          TEXT NOT NULL CHECK (char_length(headline) <= 100),
  subheadline       TEXT NOT NULL,
  cta_text          TEXT NOT NULL,
  target_networks   TEXT[] NOT NULL CHECK (cardinality(target_networks) > 0),
  requested_formats TEXT[] NOT NULL CHECK (cardinality(requested_formats) > 0),
  status            TEXT NOT NULL DEFAULT 'fila' CHECK (status IN ('fila','brand_kit','templates','assets','composicao','render','quality_check','storage','revisao','pronta','erro')),
  queue_position    INT NOT NULL DEFAULT 0 CHECK (queue_position >= 0),
  eta_minutes       INT NOT NULL DEFAULT 0 CHECK (eta_minutes >= 0),
  origin_module     TEXT NOT NULL DEFAULT 'fbr-portal',
  render_engine     TEXT DEFAULT 'htmlcsstoimage',
  fallback_engine   TEXT DEFAULT 'bannerbear',
  created_by        UUID,
  approved_by       UUID,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE social_templates (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL,
  brand_kit_id      UUID NOT NULL REFERENCES social_brand_kit_cache(id),
  name              TEXT NOT NULL,
  network           TEXT NOT NULL,
  format_slug       TEXT NOT NULL,
  content_type      TEXT NOT NULL,
  version           INT NOT NULL CHECK (version > 0),
  active            BOOLEAN NOT NULL DEFAULT TRUE,
  config            JSONB NOT NULL,
  deleted_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT social_templates_unique_version UNIQUE (company_id, network, format_slug, content_type, version)
);

CREATE TABLE social_artes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL,
  job_id            UUID NOT NULL REFERENCES social_jobs(id) ON DELETE CASCADE,
  template_id       UUID NOT NULL REFERENCES social_templates(id),
  network           TEXT NOT NULL,
  format_slug       TEXT NOT NULL,
  version           INT NOT NULL DEFAULT 1 CHECK (version > 0),
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','rendered','quality_warning','ready','error')),
  ext               TEXT NOT NULL CHECK (ext IN ('png','jpg')),
  width             INT NOT NULL CHECK (width > 0),
  height            INT NOT NULL CHECK (height > 0),
  size_bytes        BIGINT NOT NULL CHECK (size_bytes > 0),
  file_name         TEXT NOT NULL,
  file_path         TEXT NOT NULL,
  preview_url       TEXT NOT NULL,
  device_mockup     TEXT NOT NULL,
  safe_zone_rect    JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE social_quality_checks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL,
  arte_id           UUID NOT NULL REFERENCES social_artes(id) ON DELETE CASCADE,
  dimensions_ok     BOOLEAN NOT NULL DEFAULT FALSE,
  safe_zone_ok      BOOLEAN NOT NULL DEFAULT FALSE,
  file_size_ok      BOOLEAN NOT NULL DEFAULT FALSE,
  contrast_ok       BOOLEAN NOT NULL DEFAULT FALSE,
  logo_ok           BOOLEAN NOT NULL DEFAULT FALSE,
  contrast_ratio    NUMERIC(5,2) NOT NULL CHECK (contrast_ratio > 0),
  outcome           TEXT NOT NULL CHECK (outcome IN ('approved','warning','rejected')),
  notes             JSONB NOT NULL DEFAULT '[]'::jsonb,
  checked_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT social_quality_checks_one_per_arte UNIQUE (arte_id)
);

CREATE TABLE social_delivery_packages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL,
  job_id            UUID NOT NULL REFERENCES social_jobs(id) ON DELETE CASCADE,
  zip_name          TEXT NOT NULL,
  manifest_json     JSONB NOT NULL,
  storage_path      TEXT NOT NULL,
  signed_url        TEXT,
  total_files       INT NOT NULL DEFAULT 0 CHECK (total_files >= 0),
  total_size_bytes  BIGINT NOT NULL DEFAULT 0 CHECK (total_size_bytes >= 0),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE social_agent_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL,
  job_id            UUID REFERENCES social_jobs(id) ON DELETE CASCADE,
  arte_id           UUID REFERENCES social_artes(id) ON DELETE CASCADE,
  agent_slot        TEXT NOT NULL,
  event_type        TEXT NOT NULL,
  status            TEXT NOT NULL,
  progress          INT CHECK (progress IS NULL OR (progress >= 0 AND progress <= 100)),
  message           TEXT NOT NULL,
  payload           JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE social_webhook_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID,
  source            TEXT NOT NULL,
  event             TEXT NOT NULL,
  brand_kit_id      UUID,
  payload           JSONB NOT NULL,
  signature         TEXT,
  status            TEXT NOT NULL,
  latency_ms        INT CHECK (latency_ms IS NULL OR latency_ms >= 0),
  processed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_social_brand_kit_cache_company ON social_brand_kit_cache(company_id);
CREATE INDEX idx_social_jobs_company_status ON social_jobs(company_id, status);
CREATE INDEX idx_social_jobs_brand_kit ON social_jobs(brand_kit_id);
CREATE INDEX idx_social_templates_lookup ON social_templates(company_id, network, format_slug, content_type, active);
CREATE INDEX idx_social_artes_job ON social_artes(job_id);
CREATE INDEX idx_social_artes_company_network ON social_artes(company_id, network);
CREATE INDEX idx_social_quality_checks_company ON social_quality_checks(company_id);
CREATE INDEX idx_social_delivery_packages_job ON social_delivery_packages(job_id);
CREATE INDEX idx_social_agent_logs_job ON social_agent_logs(job_id);
CREATE INDEX idx_social_webhook_logs_brand_kit ON social_webhook_logs(brand_kit_id);
