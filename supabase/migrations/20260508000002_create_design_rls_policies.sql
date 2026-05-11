-- Migration: Create Design RLS Policies
-- Date: 2026-05-08
-- Story: 1.11

CREATE OR REPLACE FUNCTION design_current_company_id()
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

ALTER TABLE design_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_brand_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_job_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_review_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_review_rule_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_webhook_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_agent_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company isolation for design clients" ON design_clients
  FOR ALL
  USING (company_id = design_current_company_id())
  WITH CHECK (company_id = design_current_company_id());

CREATE POLICY "Company isolation for design brand kits" ON design_brand_kits
  FOR ALL
  USING (company_id = design_current_company_id())
  WITH CHECK (company_id = design_current_company_id());

CREATE POLICY "Company isolation for design jobs" ON design_jobs
  FOR ALL
  USING (company_id = design_current_company_id())
  WITH CHECK (company_id = design_current_company_id());

CREATE POLICY "Company isolation for design job variants" ON design_job_variants
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM design_jobs
      WHERE design_jobs.id = design_job_variants.job_id
        AND design_jobs.company_id = design_current_company_id()
    )
  )
  WITH CHECK (
    company_id = design_current_company_id()
    AND EXISTS (
      SELECT 1
      FROM design_jobs
      WHERE design_jobs.id = design_job_variants.job_id
        AND design_jobs.company_id = design_current_company_id()
    )
  );

CREATE POLICY "Company isolation for design review packs" ON design_review_packs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM design_jobs
      WHERE design_jobs.id = design_review_packs.job_id
        AND design_jobs.company_id = design_current_company_id()
    )
  )
  WITH CHECK (
    company_id = design_current_company_id()
    AND EXISTS (
      SELECT 1
      FROM design_jobs
      WHERE design_jobs.id = design_review_packs.job_id
        AND design_jobs.company_id = design_current_company_id()
    )
  );

CREATE POLICY "Company isolation for design review rule results" ON design_review_rule_results
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM design_review_packs
      WHERE design_review_packs.id = design_review_rule_results.review_pack_id
        AND design_review_packs.company_id = design_current_company_id()
    )
  )
  WITH CHECK (
    company_id = design_current_company_id()
    AND EXISTS (
      SELECT 1
      FROM design_review_packs
      WHERE design_review_packs.id = design_review_rule_results.review_pack_id
        AND design_review_packs.company_id = design_current_company_id()
    )
  );

CREATE POLICY "Company isolation for design templates" ON design_templates
  FOR ALL
  USING (company_id = design_current_company_id())
  WITH CHECK (company_id = design_current_company_id());

CREATE POLICY "Company isolation for design deliverables" ON design_deliverables
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM design_jobs
      WHERE design_jobs.id = design_deliverables.job_id
        AND design_jobs.company_id = design_current_company_id()
    )
  )
  WITH CHECK (
    company_id = design_current_company_id()
    AND EXISTS (
      SELECT 1
      FROM design_jobs
      WHERE design_jobs.id = design_deliverables.job_id
        AND design_jobs.company_id = design_current_company_id()
    )
  );

CREATE POLICY "Company isolation for design webhook log" ON design_webhook_log
  FOR ALL
  USING (company_id = design_current_company_id())
  WITH CHECK (company_id = design_current_company_id());

CREATE POLICY "Company isolation for design audit log reads" ON design_audit_log
  FOR SELECT
  USING (company_id = design_current_company_id());

CREATE POLICY "Company isolation for design audit log inserts" ON design_audit_log
  FOR INSERT
  WITH CHECK (
    company_id = design_current_company_id()
    AND pg_trigger_depth() > 0
  );

CREATE POLICY "Company isolation for design agent actions" ON design_agent_actions
  FOR ALL
  USING (company_id = design_current_company_id())
  WITH CHECK (company_id = design_current_company_id());
