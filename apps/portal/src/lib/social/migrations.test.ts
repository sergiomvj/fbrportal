import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../..');
const migrationDir = resolve(projectRoot, 'supabase/migrations');

const readMigration = (fileName: string) =>
  readFileSync(resolve(migrationDir, fileName), 'utf8').replace(/\s+/g, ' ').toLowerCase();

const tablesSql = readMigration('20260508000001_create_social_tables.sql');
const rlsSql = readMigration('20260508000002_create_social_rls_policies.sql');
const triggersSql = readMigration('20260508000003_create_social_triggers.sql');

const socialTables = [
  'brand_kit_cache',
  'jobs',
  'templates',
  'artes',
  'quality_checks',
  'delivery_packages',
  'agent_logs',
  'webhook_logs',
] as const;

describe('social database migrations', () => {
  it('covers all required social tables and PRD baseline mappings', () => {
    for (const table of socialTables) {
      expect(tablesSql).toContain(`create table social_${table}`);
    }

    expect(tablesSql).toContain('brand_kit_cache -> social_brand_kit_cache');
    expect(tablesSql).toContain('social_jobs -> social_jobs');
    expect(tablesSql).toContain('manifest_json -> social_delivery_packages.manifest_json');
    expect(tablesSql).toContain('webhook_logs -> social_webhook_logs');
  });

  it('defines uuid identifiers, jsonb payloads, timestamps, and business constraints', () => {
    for (const table of socialTables) {
      expect(tablesSql).toMatch(new RegExp(`create table social_${table} \\( id uuid primary key`));
    }

    expect(tablesSql).toContain('brand_payload jsonb not null');
    expect(tablesSql).toContain('config jsonb not null');
    expect(tablesSql).toContain('manifest_json jsonb not null');
    expect(tablesSql).toContain('target_networks text[] not null');
    expect(tablesSql).toContain('requested_formats text[] not null');
    expect(tablesSql.match(/timestamptz not null default now\(\)/g)?.length).toBeGreaterThanOrEqual(10);
  });

  it('enforces social-specific checks for statuses, dimensions, files, and template versioning', () => {
    expect(tablesSql).toContain(`status in ('fila','brand_kit','templates','assets','composicao','render','quality_check','storage','revisao','pronta','erro')`);
    expect(tablesSql).toContain(`status in ('pending','rendered','quality_warning','ready','error')`);
    expect(tablesSql).toContain(`outcome in ('approved','warning','rejected')`);
    expect(tablesSql).toContain(`ext in ('png','jpg')`);
    expect(tablesSql).toContain('char_length(headline) <= 100');
    expect(tablesSql).toContain('social_templates_unique_version unique (company_id, network, format_slug, content_type, version)');
    expect(tablesSql).toContain('social_quality_checks_one_per_arte unique (arte_id)');
    expect(tablesSql.match(/check \([^)]*(> 0|>= 0)[^)]*\)/g)?.length).toBeGreaterThanOrEqual(12);
  });

  it('enables rls and scopes social data by authenticated company', () => {
    expect(rlsSql).toContain('create or replace function social_current_company_id()');
    expect(rlsSql).toContain('auth.jwt()');
    expect(rlsSql).not.toContain('using (true)');

    for (const table of socialTables) {
      expect(rlsSql).toContain(`alter table social_${table} enable row level security`);
    }

    for (const table of ['brand_kit_cache', 'jobs', 'templates', 'artes', 'quality_checks', 'delivery_packages', 'agent_logs']) {
      expect(rlsSql).toContain(`on social_${table}`);
      expect(rlsSql).toContain('company_id = social_current_company_id()');
    }

    expect(rlsSql).toContain('on social_webhook_logs for select');
    expect(rlsSql).toContain('on social_webhook_logs for insert');
  });

  it('keeps webhook logs append-only and auto-generates agent audit rows via triggers', () => {
    expect(triggersSql).toContain('create trigger trg_protect_social_webhook_logs');
    expect(triggersSql).toContain('before update or delete on social_webhook_logs');
    expect(triggersSql).toContain('raise exception');

    expect(triggersSql).toContain('create trigger trg_social_jobs_audit');
    expect(triggersSql).toContain('create trigger trg_social_artes_audit');
    expect(triggersSql).toContain('insert into social_agent_logs');
    expect(triggersSql).toContain('job_status_changed');
    expect(triggersSql).toContain('arte_status_changed');
  });
});
