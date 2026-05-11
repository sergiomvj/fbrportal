-- Migration: Create Social Triggers
-- Date: 2026-05-08
-- Story: 1.9

CREATE OR REPLACE FUNCTION social_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_social_brand_kit_cache_touch
  BEFORE UPDATE ON social_brand_kit_cache
  FOR EACH ROW
  EXECUTE FUNCTION social_touch_updated_at();

CREATE TRIGGER trg_social_jobs_touch
  BEFORE UPDATE ON social_jobs
  FOR EACH ROW
  EXECUTE FUNCTION social_touch_updated_at();

CREATE TRIGGER trg_social_templates_touch
  BEFORE UPDATE ON social_templates
  FOR EACH ROW
  EXECUTE FUNCTION social_touch_updated_at();

CREATE TRIGGER trg_social_artes_touch
  BEFORE UPDATE ON social_artes
  FOR EACH ROW
  EXECUTE FUNCTION social_touch_updated_at();

CREATE OR REPLACE FUNCTION social_log_job_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO social_agent_logs (company_id, job_id, agent_slot, event_type, status, progress, message, payload)
    VALUES (NEW.company_id, NEW.id, 'Compositor', 'job_created', NEW.status, 0, 'Job criado no pipeline social.', to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO social_agent_logs (company_id, job_id, agent_slot, event_type, status, progress, message, payload)
    VALUES (NEW.company_id, NEW.id, 'Compositor', 'job_status_changed', NEW.status, NULL, 'Status do job atualizado.', jsonb_build_object('before', to_jsonb(OLD), 'after', to_jsonb(NEW)));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_social_jobs_audit
  AFTER INSERT OR UPDATE ON social_jobs
  FOR EACH ROW
  EXECUTE FUNCTION social_log_job_changes();

CREATE OR REPLACE FUNCTION social_log_arte_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO social_agent_logs (company_id, job_id, arte_id, agent_slot, event_type, status, progress, message, payload)
    VALUES (NEW.company_id, NEW.job_id, NEW.id, 'Compositor', 'arte_created', NEW.status, NULL, 'Arte criada para variante social.', to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO social_agent_logs (company_id, job_id, arte_id, agent_slot, event_type, status, progress, message, payload)
    VALUES (NEW.company_id, NEW.job_id, NEW.id, 'Compositor', 'arte_status_changed', NEW.status, NULL, 'Status da arte atualizado.', jsonb_build_object('before', to_jsonb(OLD), 'after', to_jsonb(NEW)));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_social_artes_audit
  AFTER INSERT OR UPDATE ON social_artes
  FOR EACH ROW
  EXECUTE FUNCTION social_log_arte_changes();

CREATE OR REPLACE FUNCTION protect_social_webhook_logs()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Social webhook log is append-only and cannot be modified or deleted.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_protect_social_webhook_logs
  BEFORE UPDATE OR DELETE ON social_webhook_logs
  FOR EACH ROW
  EXECUTE FUNCTION protect_social_webhook_logs();
