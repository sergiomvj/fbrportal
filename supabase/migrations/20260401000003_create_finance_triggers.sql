-- Migration: Create Finance Triggers
-- Date: 2026-04-01
-- Story: 1.4.2

-- Audit Trigger for Receivables
CREATE OR REPLACE FUNCTION audit_receivable_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO finance_audit_log (company_id, entity_type, entity_id, actor_type, actor_id, action, after_value)
    VALUES (NEW.company_id, 'receivable', NEW.id, 'human', COALESCE(NEW.created_by::TEXT, 'system'), 'created', to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO finance_audit_log (company_id, entity_type, entity_id, actor_type, actor_id, action, before_value, after_value)
    VALUES (NEW.company_id, 'receivable', NEW.id, 'human', COALESCE(NEW.created_by::TEXT, 'system'), 'updated', to_jsonb(OLD), to_jsonb(NEW));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_receivables
  AFTER INSERT OR UPDATE ON finance_receivables
  FOR EACH ROW
  EXECUTE FUNCTION audit_receivable_changes();

-- Audit Trigger for Payables
CREATE OR REPLACE FUNCTION audit_payable_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO finance_audit_log (company_id, entity_type, entity_id, actor_type, actor_id, action, after_value)
    VALUES (NEW.company_id, 'payable', NEW.id, 'human', COALESCE(NEW.approved_by::TEXT, 'system'), 'created', to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO finance_audit_log (company_id, entity_type, entity_id, actor_type, actor_id, action, before_value, after_value)
    VALUES (NEW.company_id, 'payable', NEW.id, 'human', COALESCE(NEW.approved_by::TEXT, 'system'), 'updated', to_jsonb(OLD), to_jsonb(NEW));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_payables
  AFTER INSERT OR UPDATE ON finance_payables
  FOR EACH ROW
  EXECUTE FUNCTION audit_payable_changes();

-- Prevent UPDATE/DELETE on Audit Log
CREATE OR REPLACE FUNCTION protect_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Finance audit log is append-only and cannot be modified or deleted.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_protect_audit_log
  BEFORE UPDATE OR DELETE ON finance_audit_log
  FOR EACH ROW
  EXECUTE FUNCTION protect_audit_log();
