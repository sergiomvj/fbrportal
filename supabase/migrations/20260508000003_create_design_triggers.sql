-- Migration: Create Design Triggers
-- Date: 2026-05-08
-- Story: 1.11

CREATE OR REPLACE FUNCTION design_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_design_clients_updated_at
  BEFORE UPDATE ON design_clients
  FOR EACH ROW
  EXECUTE FUNCTION design_set_updated_at();

CREATE TRIGGER trg_design_brand_kits_updated_at
  BEFORE UPDATE ON design_brand_kits
  FOR EACH ROW
  EXECUTE FUNCTION design_set_updated_at();

CREATE TRIGGER trg_design_jobs_updated_at
  BEFORE UPDATE ON design_jobs
  FOR EACH ROW
  EXECUTE FUNCTION design_set_updated_at();

CREATE TRIGGER trg_design_job_variants_updated_at
  BEFORE UPDATE ON design_job_variants
  FOR EACH ROW
  EXECUTE FUNCTION design_set_updated_at();

CREATE TRIGGER trg_design_review_packs_updated_at
  BEFORE UPDATE ON design_review_packs
  FOR EACH ROW
  EXECUTE FUNCTION design_set_updated_at();

CREATE TRIGGER trg_design_templates_updated_at
  BEFORE UPDATE ON design_templates
  FOR EACH ROW
  EXECUTE FUNCTION design_set_updated_at();

CREATE TRIGGER trg_design_deliverables_updated_at
  BEFORE UPDATE ON design_deliverables
  FOR EACH ROW
  EXECUTE FUNCTION design_set_updated_at();

CREATE OR REPLACE FUNCTION audit_design_brand_kit_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO design_audit_log (company_id, entity_type, entity_id, actor_type, actor_id, action, after_value)
    VALUES (NEW.company_id, 'brand_kit', NEW.id, 'human', COALESCE(NEW.created_by::TEXT, 'system'), 'created', to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO design_audit_log (company_id, entity_type, entity_id, actor_type, actor_id, action, before_value, after_value)
    VALUES (NEW.company_id, 'brand_kit', NEW.id, 'human', COALESCE(NEW.created_by::TEXT, 'system'), 'updated', to_jsonb(OLD), to_jsonb(NEW));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_design_brand_kits
  AFTER INSERT OR UPDATE ON design_brand_kits
  FOR EACH ROW
  EXECUTE FUNCTION audit_design_brand_kit_changes();

CREATE OR REPLACE FUNCTION audit_design_deliverable_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO design_audit_log (company_id, entity_type, entity_id, actor_type, actor_id, action, after_value)
    VALUES (NEW.company_id, 'deliverable', NEW.id, 'human', COALESCE(NEW.approved_by::TEXT, 'system'), 'created', to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO design_audit_log (company_id, entity_type, entity_id, actor_type, actor_id, action, before_value, after_value)
    VALUES (NEW.company_id, 'deliverable', NEW.id, 'human', COALESCE(NEW.approved_by::TEXT, 'system'), 'updated', to_jsonb(OLD), to_jsonb(NEW));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_design_deliverables
  AFTER INSERT OR UPDATE ON design_deliverables
  FOR EACH ROW
  EXECUTE FUNCTION audit_design_deliverable_changes();

CREATE OR REPLACE FUNCTION protect_design_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Design audit log is append-only and cannot be modified or deleted.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_protect_design_audit_log
  BEFORE UPDATE OR DELETE ON design_audit_log
  FOR EACH ROW
  EXECUTE FUNCTION protect_design_audit_log();
