-- Migration: Create Leads source capture persistence contracts
-- Date: 2026-05-14
-- Story: 3.1.1

CREATE OR REPLACE FUNCTION leads_current_empresa_id()
RETURNS UUID AS $$
  SELECT NULLIF(
    COALESCE(
      auth.jwt() -> 'user_metadata' ->> 'empresaId',
      auth.jwt() -> 'app_metadata' ->> 'empresaId',
      auth.jwt() -> 'user_metadata' ->> 'company_id',
      auth.jwt() -> 'app_metadata' ->> 'company_id'
    ),
    ''
  )::UUID;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION leads_current_user_id()
RETURNS UUID AS $$
  SELECT NULLIF(
    COALESCE(
      auth.jwt() ->> 'sub',
      auth.jwt() -> 'user_metadata' ->> 'userId',
      auth.jwt() -> 'app_metadata' ->> 'userId'
    ),
    ''
  )::UUID;
$$ LANGUAGE SQL STABLE;

CREATE TABLE IF NOT EXISTS leads_icps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  setor TEXT[] NOT NULL DEFAULT '{}',
  porte TEXT[] NOT NULL DEFAULT '{}',
  cargo_alvo TEXT[] NOT NULL DEFAULT '{}',
  regiao TEXT[] NOT NULL DEFAULT '{}',
  score_minimo INTEGER NOT NULL DEFAULT 60 CHECK (score_minimo BETWEEN 1 AND 100),
  keywords TEXT[] NOT NULL DEFAULT '{}',
  exclusoes TEXT[] NOT NULL DEFAULT '{}',
  porte_funcionarios_min INTEGER,
  porte_funcionarios_max INTEGER,
  faturamento_minimo NUMERIC,
  dominio_email_permitido TEXT[] NOT NULL DEFAULT ARRAY['todos'],
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leads_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL,
  dominio TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'aquecendo'
    CHECK (status IN ('saudavel', 'atencao', 'critico', 'bloqueado', 'aquecendo')),
  warming_phase TEXT NOT NULL DEFAULT 'fase1'
    CHECK (warming_phase IN ('fase1', 'fase2', 'fase3', 'fase4')),
  warming_dia INTEGER NOT NULL DEFAULT 0 CHECK (warming_dia >= 0),
  bounce_rate NUMERIC NOT NULL DEFAULT 0 CHECK (bounce_rate >= 0 AND bounce_rate <= 100),
  envios_hoje INTEGER NOT NULL DEFAULT 0 CHECK (envios_hoje >= 0),
  limite_diario INTEGER NOT NULL DEFAULT 5 CHECK (limite_diario >= 0),
  open_rate NUMERIC NOT NULL DEFAULT 0 CHECK (open_rate >= 0 AND open_rate <= 100),
  spam_complaint_rate NUMERIC NOT NULL DEFAULT 0 CHECK (spam_complaint_rate >= 0 AND spam_complaint_rate <= 100),
  blacklist BOOLEAN NOT NULL DEFAULT FALSE,
  spf_ok BOOLEAN NOT NULL DEFAULT FALSE,
  dkim_ok BOOLEAN NOT NULL DEFAULT FALSE,
  dmarc_ok BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT leads_domains_unique_empresa_domain UNIQUE (empresa_id, dominio)
);

CREATE TABLE IF NOT EXISTS leads_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL,
  user_id UUID,
  icp_id UUID REFERENCES leads_icps(id) ON DELETE SET NULL,
  empresa_nome TEXT NOT NULL,
  empresa_cnpj TEXT,
  contato_nome TEXT,
  contato_email TEXT,
  contato_cargo TEXT,
  contato_linkedin TEXT,
  contato_telefone TEXT,
  setor TEXT,
  porte TEXT,
  regiao TEXT,
  cidade TEXT,
  estado TEXT,
  funcionarios INTEGER,
  faturamento NUMERIC,
  fonte TEXT NOT NULL DEFAULT 'manual'
    CHECK (fonte IN ('linkedin', 'cnpj_biz', 'google_maps', 'site', 'manual')),
  fonte_url TEXT,
  etapa TEXT NOT NULL DEFAULT 'captado',
  score INTEGER NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
  email_valido TEXT NOT NULL DEFAULT 'nao_verificado'
    CHECK (email_valido IN ('safe', 'catch_all', 'invalido', 'disposable', 'nao_verificado')),
  motivo_descarte TEXT,
  presenca_digital TEXT CHECK (presenca_digital IS NULL OR presenca_digital IN ('forte', 'media', 'fraca', 'nenhuma')),
  site_url TEXT,
  site_tecnologias TEXT[] NOT NULL DEFAULT '{}',
  site_pagespeed INTEGER CHECK (site_pagespeed IS NULL OR site_pagespeed BETWEEN 0 AND 100),
  site_https BOOLEAN,
  site_blog_ativo BOOLEAN,
  headline TEXT,
  ultima_atividade DATE,
  conexoes_comum INTEGER,
  notas TEXT,
  hash_deduplicacao TEXT,
  fontes_origem TEXT[] NOT NULL DEFAULT '{}',
  score_detalhado JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leads_source_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL,
  fonte TEXT NOT NULL CHECK (fonte IN ('linkedin', 'cnpj_biz', 'google_maps', 'site')),
  query JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'done', 'failed')),
  total_records INTEGER NOT NULL DEFAULT 0 CHECK (total_records >= 0),
  leads_created INTEGER NOT NULL DEFAULT 0 CHECK (leads_created >= 0),
  duplicates INTEGER NOT NULL DEFAULT 0 CHECK (duplicates >= 0),
  failed_records INTEGER NOT NULL DEFAULT 0 CHECK (failed_records >= 0),
  error TEXT,
  created_by UUID,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leads_source_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL,
  source_run_id UUID NOT NULL REFERENCES leads_source_runs(id) ON DELETE CASCADE,
  fonte TEXT NOT NULL CHECK (fonte IN ('linkedin', 'cnpj_biz', 'google_maps', 'site')),
  source_key TEXT NOT NULL,
  raw_payload JSONB NOT NULL,
  normalized_lead_id UUID REFERENCES leads_leads(id) ON DELETE SET NULL,
  duplicate_status TEXT NOT NULL DEFAULT 'new' CHECK (duplicate_status IN ('new', 'duplicate')),
  duplicate_of_lead_id UUID REFERENCES leads_leads(id) ON DELETE SET NULL,
  error TEXT,
  captured_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT leads_source_records_unique_run_key UNIQUE (source_run_id, source_key)
);

CREATE TABLE IF NOT EXISTS leads_email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL,
  icp_id UUID REFERENCES leads_icps(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  toque INTEGER NOT NULL CHECK (toque BETWEEN 1 AND 4),
  subject_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  variaveis TEXT[] NOT NULL DEFAULT '{}',
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leads_email_cadencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL,
  lead_id UUID NOT NULL REFERENCES leads_leads(id) ON DELETE CASCADE,
  dominio_id UUID REFERENCES leads_domains(id) ON DELETE SET NULL,
  toque INTEGER NOT NULL CHECK (toque BETWEEN 1 AND 4),
  status TEXT NOT NULL DEFAULT 'enviado'
    CHECK (status IN ('enviado', 'bounce', 'aberto', 'clicou', 'respondido')),
  subject TEXT,
  body TEXT,
  agente TEXT,
  enviado_em TIMESTAMPTZ,
  aberto_em TIMESTAMPTZ,
  respondido_em TIMESTAMPTZ,
  resposta_tipo TEXT CHECK (resposta_tipo IS NULL OR resposta_tipo IN ('positiva', 'neutra', 'negativa', 'stop')),
  resposta_conteudo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_leads_empresa ON leads_leads(empresa_id);
CREATE INDEX IF NOT EXISTS idx_leads_leads_empresa_hash ON leads_leads(empresa_id, hash_deduplicacao);
CREATE INDEX IF NOT EXISTS idx_leads_source_runs_empresa_status ON leads_source_runs(empresa_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_source_records_run ON leads_source_records(source_run_id);
CREATE INDEX IF NOT EXISTS idx_leads_source_records_empresa_key ON leads_source_records(empresa_id, source_key);
CREATE INDEX IF NOT EXISTS idx_leads_cadencias_empresa_lead ON leads_email_cadencias(empresa_id, lead_id);

ALTER TABLE leads_icps ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads_source_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads_source_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads_email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads_email_cadencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company isolation for leads icps" ON leads_icps
  FOR ALL USING (empresa_id = leads_current_empresa_id())
  WITH CHECK (empresa_id = leads_current_empresa_id());

CREATE POLICY "Company isolation for leads domains" ON leads_domains
  FOR ALL USING (empresa_id = leads_current_empresa_id())
  WITH CHECK (empresa_id = leads_current_empresa_id());

CREATE POLICY "Company isolation for leads leads" ON leads_leads
  FOR ALL USING (empresa_id = leads_current_empresa_id())
  WITH CHECK (empresa_id = leads_current_empresa_id());

CREATE POLICY "Company isolation for leads source runs" ON leads_source_runs
  FOR ALL USING (empresa_id = leads_current_empresa_id())
  WITH CHECK (empresa_id = leads_current_empresa_id());

CREATE POLICY "Company isolation for leads source records" ON leads_source_records
  FOR ALL USING (empresa_id = leads_current_empresa_id())
  WITH CHECK (empresa_id = leads_current_empresa_id());

CREATE POLICY "Company isolation for leads templates" ON leads_email_templates
  FOR ALL USING (empresa_id = leads_current_empresa_id())
  WITH CHECK (empresa_id = leads_current_empresa_id());

CREATE POLICY "Company isolation for leads cadencias" ON leads_email_cadencias
  FOR ALL USING (empresa_id = leads_current_empresa_id())
  WITH CHECK (empresa_id = leads_current_empresa_id());
