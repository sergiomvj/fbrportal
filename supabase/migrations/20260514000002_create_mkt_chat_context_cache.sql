-- Migration: Persist MKT chat context cache
-- Date: 2026-05-14
-- Story: 2.5.8
-- Provides the PRD 30-minute context cache without relying on process memory.

CREATE TABLE IF NOT EXISTS mkt_chat_context_cache (
  estrategia_id UUID NOT NULL REFERENCES mkt_estrategias(id) ON DELETE CASCADE,
  empresa_id    UUID NOT NULL,
  payload       JSONB NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (estrategia_id, empresa_id)
);

CREATE INDEX IF NOT EXISTS idx_mkt_chat_context_cache_expires_at
  ON mkt_chat_context_cache(expires_at);

