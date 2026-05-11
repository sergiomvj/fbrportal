-- Migration: Create MKT Triggers
-- Date: 2026-05-11
-- Story: 2.5.1

CREATE OR REPLACE FUNCTION mkt_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_mkt_branding_touch
  BEFORE UPDATE ON mkt_branding
  FOR EACH ROW EXECUTE FUNCTION mkt_touch_updated_at();

CREATE TRIGGER trg_mkt_estrategias_touch
  BEFORE UPDATE ON mkt_estrategias
  FOR EACH ROW EXECUTE FUNCTION mkt_touch_updated_at();

CREATE TRIGGER trg_mkt_agents_touch
  BEFORE UPDATE ON mkt_agents
  FOR EACH ROW EXECUTE FUNCTION mkt_touch_updated_at();

CREATE TRIGGER trg_mkt_jobs_touch
  BEFORE UPDATE ON mkt_processing_jobs
  FOR EACH ROW EXECUTE FUNCTION mkt_touch_updated_at();

CREATE OR REPLACE FUNCTION mkt_log_job_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO mkt_agent_action_logs (empresa_id, slot, acao, entidade_tipo, entidade_id, detalhes, executado_por)
    VALUES (NEW.empresa_id, 'extrator', 'job_created', 'processing_job', NEW.id, to_jsonb(NEW), NEW.empresa_id);
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO mkt_agent_action_logs (empresa_id, slot, acao, entidade_tipo, entidade_id, detalhes, executado_por)
    VALUES (NEW.empresa_id, 'extrator', 'job_status_changed', 'processing_job', NEW.id,
      jsonb_build_object('before', OLD.status, 'after', NEW.status), NEW.empresa_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_mkt_jobs_audit
  AFTER INSERT OR UPDATE ON mkt_processing_jobs
  FOR EACH ROW EXECUTE FUNCTION mkt_log_job_changes();

CREATE OR REPLACE FUNCTION mkt_log_estrategia_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO mkt_agent_action_logs (empresa_id, slot, acao, entidade_tipo, entidade_id, detalhes, executado_por)
    VALUES (NEW.empresa_id, 'estrategista', 'estrategia_created', 'estrategia', NEW.id,
      jsonb_build_object('nome', NEW.nome, 'status', NEW.status), NEW.user_id);
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO mkt_agent_action_logs (empresa_id, slot, acao, entidade_tipo, entidade_id, detalhes, executado_por)
    VALUES (NEW.empresa_id, 'estrategista', 'estrategia_status_changed', 'estrategia', NEW.id,
      jsonb_build_object('before', OLD.status, 'after', NEW.status), NEW.user_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_mkt_estrategias_audit
  AFTER INSERT OR UPDATE ON mkt_estrategias
  FOR EACH ROW EXECUTE FUNCTION mkt_log_estrategia_changes();

CREATE OR REPLACE FUNCTION mkt_protect_agent_action_logs()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'MKT agent action log is append-only and cannot be modified or deleted.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_protect_mkt_agent_logs
  BEFORE UPDATE OR DELETE ON mkt_agent_action_logs
  FOR EACH ROW EXECUTE FUNCTION mkt_protect_agent_action_logs();
