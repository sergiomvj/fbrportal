-- Migration: Create MKT RLS Policies
-- Date: 2026-05-11
-- Story: 2.5.1

CREATE OR REPLACE FUNCTION mkt_current_empresa_id()
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

CREATE OR REPLACE FUNCTION mkt_current_user_id()
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

ALTER TABLE mkt_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE mkt_estrategias ENABLE ROW LEVEL SECURITY;
ALTER TABLE mkt_diagnosticos ENABLE ROW LEVEL SECURITY;
ALTER TABLE mkt_estrategia_versoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mkt_copywriting_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE mkt_lead_magnets ENABLE ROW LEVEL SECURITY;
ALTER TABLE mkt_calendar_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE mkt_roadmap_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE mkt_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE mkt_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE mkt_processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mkt_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE mkt_agent_action_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company isolation for mkt branding" ON mkt_branding
  FOR ALL
  USING (empresa_id = mkt_current_empresa_id())
  WITH CHECK (empresa_id = mkt_current_empresa_id());

CREATE POLICY "Company isolation for mkt estrategias" ON mkt_estrategias
  FOR ALL
  USING (empresa_id = mkt_current_empresa_id())
  WITH CHECK (empresa_id = mkt_current_empresa_id());

CREATE POLICY "Company isolation for mkt diagnosticos" ON mkt_diagnosticos
  FOR ALL
  USING (estrategia_id IN (SELECT id FROM mkt_estrategias WHERE empresa_id = mkt_current_empresa_id()))
  WITH CHECK (estrategia_id IN (SELECT id FROM mkt_estrategias WHERE empresa_id = mkt_current_empresa_id()));

CREATE POLICY "Company isolation for mkt versoes" ON mkt_estrategia_versoes
  FOR ALL
  USING (estrategia_id IN (SELECT id FROM mkt_estrategias WHERE empresa_id = mkt_current_empresa_id()))
  WITH CHECK (estrategia_id IN (SELECT id FROM mkt_estrategias WHERE empresa_id = mkt_current_empresa_id()));

CREATE POLICY "Company isolation for mkt copywriting" ON mkt_copywriting_variants
  FOR ALL
  USING (estrategia_id IN (SELECT id FROM mkt_estrategias WHERE empresa_id = mkt_current_empresa_id()))
  WITH CHECK (estrategia_id IN (SELECT id FROM mkt_estrategias WHERE empresa_id = mkt_current_empresa_id()));

CREATE POLICY "Company isolation for mkt lead magnets" ON mkt_lead_magnets
  FOR ALL
  USING (estrategia_id IN (SELECT id FROM mkt_estrategias WHERE empresa_id = mkt_current_empresa_id()))
  WITH CHECK (estrategia_id IN (SELECT id FROM mkt_estrategias WHERE empresa_id = mkt_current_empresa_id()));

CREATE POLICY "Company isolation for mkt calendar" ON mkt_calendar_items
  FOR ALL
  USING (estrategia_id IN (SELECT id FROM mkt_estrategias WHERE empresa_id = mkt_current_empresa_id()))
  WITH CHECK (estrategia_id IN (SELECT id FROM mkt_estrategias WHERE empresa_id = mkt_current_empresa_id()));

CREATE POLICY "Company isolation for mkt roadmap" ON mkt_roadmap_tasks
  FOR ALL
  USING (estrategia_id IN (SELECT id FROM mkt_estrategias WHERE empresa_id = mkt_current_empresa_id()))
  WITH CHECK (estrategia_id IN (SELECT id FROM mkt_estrategias WHERE empresa_id = mkt_current_empresa_id()));

CREATE POLICY "Company isolation for mkt chat" ON mkt_chat_messages
  FOR ALL
  USING (estrategia_id IN (SELECT id FROM mkt_estrategias WHERE empresa_id = mkt_current_empresa_id()))
  WITH CHECK (estrategia_id IN (SELECT id FROM mkt_estrategias WHERE empresa_id = mkt_current_empresa_id()));

CREATE POLICY "Company isolation for mkt exports" ON mkt_exports
  FOR ALL
  USING (estrategia_id IN (SELECT id FROM mkt_estrategias WHERE empresa_id = mkt_current_empresa_id()))
  WITH CHECK (estrategia_id IN (SELECT id FROM mkt_estrategias WHERE empresa_id = mkt_current_empresa_id()));

CREATE POLICY "Company isolation for mkt jobs" ON mkt_processing_jobs
  FOR ALL
  USING (empresa_id = mkt_current_empresa_id())
  WITH CHECK (empresa_id = mkt_current_empresa_id());

CREATE POLICY "Company isolation for mkt agents" ON mkt_agents
  FOR ALL
  USING (empresa_id = mkt_current_empresa_id())
  WITH CHECK (empresa_id = mkt_current_empresa_id());

CREATE POLICY "Company isolation for mkt agent logs" ON mkt_agent_action_logs
  FOR ALL
  USING (empresa_id = mkt_current_empresa_id())
  WITH CHECK (empresa_id = mkt_current_empresa_id());
