import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../..');
const migrationDir = resolve(projectRoot, 'supabase/migrations');

const readMigration = (fileName: string) =>
  readFileSync(resolve(migrationDir, fileName), 'utf8').replace(/\s+/g, ' ').toLowerCase();

const tablesSql = readMigration('20260508000001_create_design_tables.sql');
const rlsSql = readMigration('20260508000002_create_design_rls_policies.sql');
const triggersSql = readMigration('20260508000003_create_design_triggers.sql');

const designTables = [
  'clients',
  'brand_kits',
  'jobs',
  'job_variants',
  'review_packs',
  'review_rule_results',
  'templates',
  'deliverables',
  'webhook_log',
  'audit_log',
  'agent_actions',
] as const;

describe('design database migrations', () => {
  it('covers all required design tables and PRD baseline mappings', () => {
    for (const table of designTables) {
      expect(tablesSql).toContain(`create table design_${table}`);
    }

    expect(tablesSql).toContain('ds_clientes -> design_clients');
    expect(tablesSql).toContain('ds_brand_kits -> design_brand_kits');
    expect(tablesSql).toContain('ds_jobs -> design_jobs');
    expect(tablesSql).toContain('ds_templates -> design_templates');
  });

  it('defines uuid identifiers, foreign keys, timestamps and jsonb payload columns', () => {
    for (const table of designTables) {
      expect(tablesSql).toMatch(new RegExp(`create table design_${table} \\( id uuid primary key`));
    }

    expect(tablesSql.match(/references design_clients\(id\)/g)?.length).toBeGreaterThanOrEqual(2);
    expect(tablesSql.match(/references design_jobs\(id\)/g)?.length).toBeGreaterThanOrEqual(3);
    expect(tablesSql.match(/timestamptz not null default now\(\)/g)?.length).toBeGreaterThanOrEqual(10);
    expect(tablesSql).toContain('cores jsonb not null');
    expect(tablesSql).toContain('fontes jsonb not null');
    expect(tablesSql).toContain('review_payload jsonb not null');
    expect(tablesSql).toContain('before_value jsonb');
    expect(tablesSql).toContain('after_value jsonb');
  });

  it('enforces format, progress, confidence and review constraints at migration level', () => {
    expect(tablesSql).toContain("check (status in ('queued', 'processing', 'review_blocked', 'ready', 'approved', 'published'))");
    expect(tablesSql).toContain('check (progress >= 0 and progress <= 100)');
    expect(tablesSql).toContain('check (delta_e >= 0)');
    expect(tablesSql).toContain("check (format in ('png', 'jpg', 'pdf', 'pptx', 'zip'))");
    expect(tablesSql).toContain("check (rule_key in ('no_links', 'no_spam_words', 'correct_proportions', 'safe_zone', 'brand_colors', 'logo_visibility', 'text_legibility', 'spam_ratio'))");
    expect(tablesSql).toContain('confidence numeric(5,2) check (confidence is null or (confidence >= 0 and confidence <= 100))');
  });

  it('enables rls and scopes all design records to the authenticated company', () => {
    expect(rlsSql).toContain('create or replace function design_current_company_id()');
    expect(rlsSql).toContain('auth.jwt()');
    expect(rlsSql).not.toContain('using (true)');

    for (const table of designTables) {
      expect(rlsSql).toContain(`alter table design_${table} enable row level security`);
    }

    expect(rlsSql).toContain('company_id = design_current_company_id()');
    expect(rlsSql).toContain('from design_jobs');
    expect(rlsSql).toContain('from design_review_packs');
    expect(rlsSql).toContain('pg_trigger_depth() > 0');
  });

  it('keeps audit log append-only and trigger-controlled while auditing brand kits and deliverables', () => {
    expect(rlsSql).toContain('on design_audit_log for select');
    expect(rlsSql).toContain('on design_audit_log for insert');
    expect(rlsSql).not.toContain('on design_audit_log for update');
    expect(rlsSql).not.toContain('on design_audit_log for delete');

    expect(triggersSql).toContain('create trigger trg_audit_design_brand_kits');
    expect(triggersSql).toContain('create trigger trg_audit_design_deliverables');
    expect(triggersSql).toContain('after insert or update on design_brand_kits');
    expect(triggersSql).toContain('after insert or update on design_deliverables');
    expect(triggersSql).toContain('before update or delete on design_audit_log');
    expect(triggersSql).toContain('raise exception');
  });
});
