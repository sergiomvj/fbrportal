-- Migration: Create MKT Tables
-- Date: 2026-05-11
-- Story: 2.5.1
-- Creates 16 tables for FBR-MKT data foundation
-- Following PRD_SPEC_TASKLIST.md and TASKS_MKT.md

-- 1. Organizations (MKT branding extension)
CREATE TABLE IF NOT EXISTS mkt_branding (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id        UUID NOT NULL,
  logo_path         TEXT,
  cor_primaria      TEXT NOT NULL DEFAULT '#0EA5E9',
  cor_secundaria    TEXT NOT NULL DEFAULT '#8B5CF6',
  fonte_principal   TEXT NOT NULL DEFAULT 'Inter',
  nome_empresa      TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT mkt_branding_unique_empresa UNIQUE (empresa_id)
);

-- 2. Estrategias (core entity)
CREATE TABLE IF NOT EXISTS mkt_estrategias (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL,
  empresa_id   UUID NOT NULL,
  nome         TEXT NOT NULL CHECK (char_length(nome) >= 3),
  nicho        TEXT,
  status       TEXT NOT NULL DEFAULT 'processando'
    CHECK (status IN ('processando', 'revisao', 'ativa', 'arquivada')),
  doc_path     TEXT,
  versao       INTEGER NOT NULL DEFAULT 0 CHECK (versao >= 0),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Diagnosticos
CREATE TABLE IF NOT EXISTS mkt_diagnosticos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estrategia_id UUID NOT NULL REFERENCES mkt_estrategias(id) ON DELETE CASCADE,
  swot          JSONB NOT NULL,
  persona       JSONB NOT NULL,
  uvp           TEXT NOT NULL,
  score_viab    INTEGER NOT NULL CHECK (score_viab >= 0 AND score_viab <= 100),
  justificativa TEXT NOT NULL,
  nicho         TEXT,
  budget_estimado TEXT,
  timeline_estimado TEXT,
  aprovado      BOOLEAN NOT NULL DEFAULT FALSE,
  aprovado_por  UUID,
  aprovado_em   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Estrategia Versoes (immutable snapshots)
CREATE TABLE IF NOT EXISTS mkt_estrategia_versoes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estrategia_id UUID NOT NULL REFERENCES mkt_estrategias(id) ON DELETE CASCADE,
  versao        INTEGER NOT NULL CHECK (versao >= 1),
  conteudo      JSONB NOT NULL,
  gerado_por    TEXT NOT NULL DEFAULT 'estrategista_bot',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT mkt_versoes_unique UNIQUE (estrategia_id, versao)
);

-- 5. Copywriting Variants
CREATE TABLE IF NOT EXISTS mkt_copywriting_variants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estrategia_id   UUID NOT NULL REFERENCES mkt_estrategias(id) ON DELETE CASCADE,
  versao          INTEGER NOT NULL CHECK (versao >= 1),
  campanha_nome   TEXT NOT NULL,
  tipo            TEXT NOT NULL CHECK (tipo IN ('headline', 'cta', 'body', 'landing_page', 'email')),
  canal           TEXT NOT NULL,
  conteudo        TEXT NOT NULL,
  tom             TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Lead Magnets
CREATE TABLE IF NOT EXISTS mkt_lead_magnets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estrategia_id   UUID NOT NULL REFERENCES mkt_estrategias(id) ON DELETE CASCADE,
  versao          INTEGER NOT NULL CHECK (versao >= 1),
  nome            TEXT NOT NULL,
  persona_alvo    TEXT NOT NULL,
  funil_estagio   TEXT NOT NULL CHECK (funil_estagio IN ('topo', 'meio', 'fundo')),
  landing_page    JSONB NOT NULL,
  nurture_emails  JSONB NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Calendar Items
CREATE TABLE IF NOT EXISTS mkt_calendar_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estrategia_id   UUID NOT NULL REFERENCES mkt_estrategias(id) ON DELETE CASCADE,
  versao          INTEGER NOT NULL CHECK (versao >= 1),
  data            DATE NOT NULL,
  canal           TEXT NOT NULL,
  tipo            TEXT NOT NULL CHECK (tipo IN ('organico', 'pago')),
  tema            TEXT NOT NULL,
  copy_resumo     TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'agendado', 'publicado')),
  is_quick_win    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Roadmap Tasks
CREATE TABLE IF NOT EXISTS mkt_roadmap_tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estrategia_id   UUID NOT NULL REFERENCES mkt_estrategias(id) ON DELETE CASCADE,
  versao          INTEGER NOT NULL CHECK (versao >= 1),
  fase            TEXT NOT NULL CHECK (fase IN ('0-30d', '30-60d', '60-90d')),
  item            TEXT NOT NULL,
  responsavel     TEXT,
  ferramenta      TEXT,
  status          TEXT NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'em_progresso', 'concluido')),
  alerta_prazo    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Chat Messages
CREATE TABLE IF NOT EXISTS mkt_chat_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estrategia_id   UUID NOT NULL REFERENCES mkt_estrategias(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  conteudo        TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Exports
CREATE TABLE IF NOT EXISTS mkt_exports (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estrategia_id         UUID NOT NULL REFERENCES mkt_estrategias(id) ON DELETE CASCADE,
  versao                INTEGER NOT NULL CHECK (versao >= 1),
  formato               TEXT NOT NULL CHECK (formato IN ('pdf', 'pptx')),
  status                TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'done', 'failed')),
  file_path             TEXT,
  signed_url            TEXT,
  signed_url_expires_at TIMESTAMPTZ,
  file_size_bytes       BIGINT CHECK (file_size_bytes IS NULL OR file_size_bytes > 0),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at          TIMESTAMPTZ
);

-- 11. Processing Jobs
CREATE TABLE IF NOT EXISTS mkt_processing_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id      UUID NOT NULL,
  estrategia_id   UUID NOT NULL REFERENCES mkt_estrategias(id) ON DELETE CASCADE,
  categoria       TEXT NOT NULL
    CHECK (categoria IN ('upload', 'extracao', 'geracao_estrategia', 'copy', 'calendario', 'export', 'fbr_click_delivery')),
  status          TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'done', 'failed')),
  tentativas      INTEGER NOT NULL DEFAULT 0 CHECK (tentativas >= 0),
  max_tentativas  INTEGER NOT NULL DEFAULT 3 CHECK (max_tentativas >= 1),
  erro_mensagem   TEXT,
  payload         JSONB,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  failed_at       TIMESTAMPTZ,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Agents
CREATE TABLE IF NOT EXISTS mkt_agents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id      UUID NOT NULL,
  slot            TEXT NOT NULL
    CHECK (slot IN ('extrator', 'estrategista', 'redator', 'calendario', 'exportador', 'onboarding')),
  nome            TEXT NOT NULL,
  descricao       TEXT NOT NULL,
  ativo           BOOLEAN NOT NULL DEFAULT TRUE,
  arva_agent_id   TEXT,
  config          JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT mkt_agents_unique_slot UNIQUE (empresa_id, slot)
);

-- 13. Agent Action Logs (append-only)
CREATE TABLE IF NOT EXISTS mkt_agent_action_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id      UUID NOT NULL,
  agent_id        UUID,
  slot            TEXT NOT NULL
    CHECK (slot IN ('extrator', 'estrategista', 'redator', 'calendario', 'exportador', 'onboarding')),
  acao            TEXT NOT NULL,
  entidade_tipo   TEXT NOT NULL,
  entidade_id     UUID NOT NULL,
  detalhes        JSONB,
  executado_por   UUID NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mkt_estrategias_empresa ON mkt_estrategias(empresa_id);
CREATE INDEX IF NOT EXISTS idx_mkt_estrategias_empresa_status ON mkt_estrategias(empresa_id, status);
CREATE INDEX IF NOT EXISTS idx_mkt_estrategias_ativas ON mkt_estrategias(empresa_id) WHERE status = 'ativa';
CREATE INDEX IF NOT EXISTS idx_mkt_diagnosticos_estrategia ON mkt_diagnosticos(estrategia_id);
CREATE INDEX IF NOT EXISTS idx_mkt_versoes_estrategia_versao ON mkt_estrategia_versoes(estrategia_id, versao);
CREATE INDEX IF NOT EXISTS idx_mkt_copy_estrategia ON mkt_copywriting_variants(estrategia_id);
CREATE INDEX IF NOT EXISTS idx_mkt_lead_magnets_estrategia ON mkt_lead_magnets(estrategia_id);
CREATE INDEX IF NOT EXISTS idx_mkt_calendar_estrategia ON mkt_calendar_items(estrategia_id);
CREATE INDEX IF NOT EXISTS idx_mkt_calendar_data ON mkt_calendar_items(estrategia_id, data);
CREATE INDEX IF NOT EXISTS idx_mkt_roadmap_estrategia ON mkt_roadmap_tasks(estrategia_id);
CREATE INDEX IF NOT EXISTS idx_mkt_chat_estrategia ON mkt_chat_messages(estrategia_id);
CREATE INDEX IF NOT EXISTS idx_mkt_exports_estrategia ON mkt_exports(estrategia_id);
CREATE INDEX IF NOT EXISTS idx_mkt_jobs_empresa_status ON mkt_processing_jobs(empresa_id, status);
CREATE INDEX IF NOT EXISTS idx_mkt_jobs_next_attempt ON mkt_processing_jobs(status, next_attempt_at);
CREATE INDEX IF NOT EXISTS idx_mkt_jobs_estrategia ON mkt_processing_jobs(estrategia_id);
CREATE INDEX IF NOT EXISTS idx_mkt_agents_empresa_slot ON mkt_agents(empresa_id, slot);
CREATE INDEX IF NOT EXISTS idx_mkt_agent_logs_empresa ON mkt_agent_action_logs(empresa_id);
CREATE INDEX IF NOT EXISTS idx_mkt_agent_logs_entidade ON mkt_agent_action_logs(entidade_tipo, entidade_id);
