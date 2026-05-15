-- Migration: Persist MKT route rate limits
-- Date: 2026-05-13
-- Story: 2.5.0
-- Replaces process-local route counters with a database-backed limiter.

CREATE TABLE IF NOT EXISTS mkt_rate_limits (
  key        TEXT PRIMARY KEY,
  count      INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
  reset_at   TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mkt_rate_limits_reset_at ON mkt_rate_limits(reset_at);

CREATE OR REPLACE FUNCTION mkt_consume_rate_limit(
  p_key TEXT,
  p_limit INTEGER,
  p_window_ms INTEGER
)
RETURNS TABLE(allowed BOOLEAN, remaining INTEGER, reset_at_ms DOUBLE PRECISION)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_reset TIMESTAMPTZ;
  v_count INTEGER;
BEGIN
  INSERT INTO mkt_rate_limits AS rl (key, count, reset_at, updated_at)
  VALUES (p_key, 1, v_now + ((p_window_ms::TEXT || ' milliseconds')::INTERVAL), v_now)
  ON CONFLICT (key) DO UPDATE
    SET count = CASE
          WHEN rl.reset_at <= v_now THEN 1
          ELSE rl.count + 1
        END,
        reset_at = CASE
          WHEN rl.reset_at <= v_now THEN v_now + ((p_window_ms::TEXT || ' milliseconds')::INTERVAL)
          ELSE rl.reset_at
        END,
        updated_at = v_now
  RETURNING rl.count, rl.reset_at INTO v_count, v_reset;

  allowed := v_count <= p_limit;
  remaining := GREATEST(p_limit - v_count, 0);
  reset_at_ms := EXTRACT(EPOCH FROM v_reset) * 1000;
  RETURN NEXT;
END;
$$;
