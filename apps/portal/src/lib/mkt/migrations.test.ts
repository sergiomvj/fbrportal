import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../..');
const migrationDir = resolve(projectRoot, 'supabase/migrations');

const readMigration = (fileName: string) =>
  readFileSync(resolve(migrationDir, fileName), 'utf8').replace(/\s+/g, ' ').toLowerCase();

describe('MKT database migrations', () => {
  it('defines a persistent route rate-limit table and consume function for proxy routes', () => {
    const sql = readMigration('20260513000001_create_mkt_rate_limits.sql');

    expect(sql).toContain('create table if not exists mkt_rate_limits');
    expect(sql).toContain('key text primary key');
    expect(sql).toContain('create or replace function mkt_consume_rate_limit');
    expect(sql).toContain('security definer');
    expect(sql).toContain('on conflict (key) do update');
    expect(sql).toContain('returns table(allowed boolean, remaining integer, reset_at_ms double precision)');
  });

  it('defines persisted retry scheduling columns for MKT processing jobs', () => {
    const sql = readMigration('20260511000001_create_mkt_tables.sql');

    expect(sql).toContain('next_attempt_at timestamptz not null default now()');
    expect(sql).toContain('idx_mkt_jobs_next_attempt');
    expect(sql).toContain('mkt_processing_jobs(status, next_attempt_at)');
  });

  it('defines a persistent chat context cache with expiration for PRD chat sessions', () => {
    const sql = readMigration('20260514000002_create_mkt_chat_context_cache.sql');

    expect(sql).toContain('create table if not exists mkt_chat_context_cache');
    expect(sql).toContain('payload jsonb not null');
    expect(sql).toContain('expires_at timestamptz not null');
    expect(sql).toContain('primary key (estrategia_id, empresa_id)');
    expect(sql).toContain('idx_mkt_chat_context_cache_expires_at');
  });

  it('defines persisted company-scoped MKT notifications instead of process memory', () => {
    const sql = readMigration('20260514000003_create_mkt_notifications.sql');

    expect(sql).toContain('create table if not exists mkt_notifications');
    expect(sql).toContain('empresa_id uuid not null');
    expect(sql).toContain("check (tipo in ('strategy_ready', 'export_ready', 'critical_failure', 'upload_completed', 'diagnostico_ready'))");
    expect(sql).toContain('idx_mkt_notifications_empresa_created');
    expect(sql).toContain('alter table mkt_notifications enable row level security');
    expect(sql).toContain('empresa_id = mkt_current_empresa_id()');
  });
});
