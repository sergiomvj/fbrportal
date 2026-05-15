-- Migration: Persist MKT operational notifications
-- Date: 2026-05-14
-- Story: 2.5.10 / operational architecture closure
-- Replaces process-local notification arrays with company-scoped persisted state.

CREATE TABLE IF NOT EXISTS mkt_notifications (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id     UUID NOT NULL,
  user_id        UUID,
  tipo           TEXT NOT NULL
    CHECK (tipo IN ('strategy_ready', 'export_ready', 'critical_failure', 'upload_completed', 'diagnostico_ready')),
  titulo         TEXT NOT NULL,
  mensagem       TEXT NOT NULL,
  entidade_id    UUID,
  entidade_tipo  TEXT,
  lida           BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mkt_notifications_empresa_created
  ON mkt_notifications(empresa_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_mkt_notifications_empresa_unread
  ON mkt_notifications(empresa_id, lida, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_mkt_notifications_user
  ON mkt_notifications(user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

ALTER TABLE mkt_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company isolation for mkt notifications" ON mkt_notifications
  FOR ALL
  USING (empresa_id = mkt_current_empresa_id())
  WITH CHECK (empresa_id = mkt_current_empresa_id());
