-- Migration: Create Social RLS Policies
-- Date: 2026-05-08
-- Story: 1.9

CREATE OR REPLACE FUNCTION social_current_company_id()
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

ALTER TABLE social_brand_kit_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_artes ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_quality_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_delivery_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_agent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company isolation for social brand kit cache" ON social_brand_kit_cache
  FOR ALL
  USING (company_id = social_current_company_id())
  WITH CHECK (company_id = social_current_company_id());

CREATE POLICY "Company isolation for social jobs" ON social_jobs
  FOR ALL
  USING (company_id = social_current_company_id())
  WITH CHECK (company_id = social_current_company_id());

CREATE POLICY "Company isolation for social templates" ON social_templates
  FOR ALL
  USING (company_id = social_current_company_id())
  WITH CHECK (company_id = social_current_company_id());

CREATE POLICY "Company isolation for social artes" ON social_artes
  FOR ALL
  USING (company_id = social_current_company_id())
  WITH CHECK (company_id = social_current_company_id());

CREATE POLICY "Company isolation for social quality checks" ON social_quality_checks
  FOR ALL
  USING (company_id = social_current_company_id())
  WITH CHECK (company_id = social_current_company_id());

CREATE POLICY "Company isolation for social delivery packages" ON social_delivery_packages
  FOR ALL
  USING (company_id = social_current_company_id())
  WITH CHECK (company_id = social_current_company_id());

CREATE POLICY "Company isolation for social agent logs" ON social_agent_logs
  FOR ALL
  USING (company_id = social_current_company_id())
  WITH CHECK (company_id = social_current_company_id());

CREATE POLICY "Company isolation for social webhook logs reads" ON social_webhook_logs
  FOR SELECT
  USING (
    company_id IS NULL
    OR company_id = social_current_company_id()
  );

CREATE POLICY "Company isolation for social webhook logs inserts" ON social_webhook_logs
  FOR INSERT
  WITH CHECK (
    company_id IS NULL
    OR company_id = social_current_company_id()
  );
