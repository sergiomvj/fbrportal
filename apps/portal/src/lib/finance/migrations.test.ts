import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../..');
const migrationDir = resolve(projectRoot, 'supabase/migrations');

const readMigration = (fileName: string) =>
  readFileSync(resolve(migrationDir, fileName), 'utf8').replace(/\s+/g, ' ').toLowerCase();

const tablesSql = readMigration('20260401000001_create_finance_tables.sql');
const rlsSql = readMigration('20260401000002_create_finance_rls_policies.sql');
const triggersSql = readMigration('20260401000003_create_finance_triggers.sql');

const financeTables = [
  'companies',
  'cost_centers',
  'transactions',
  'receivables',
  'payables',
  'bank_accounts',
  'bank_statements',
  'reconciliation_items',
  'budgets',
  'suppliers',
  'approval_flows',
  'forecasts',
  'audit_log',
  'agent_actions',
] as const;

const companyScopedTables = financeTables.filter(
  table => table !== 'companies' && table !== 'approval_flows' && table !== 'audit_log',
);

describe('finance database migrations', () => {
  it('covers all required finance tables and SPEC baseline mappings', () => {
    for (const table of financeTables) {
      expect(tablesSql).toContain(`create table finance_${table}`);
    }

    expect(tablesSql).toContain('empresas_financeiras -> finance_companies');
    expect(tablesSql).toContain('recebimentos -> finance_receivables');
    expect(tablesSql).toContain('pagamentos -> finance_payables');
    expect(tablesSql).toContain('audit_financeiro -> finance_audit_log');
  });

  it('defines UUID identifiers, FKs, timestamps, JSONB audit payloads, and monetary precision', () => {
    for (const table of financeTables) {
      expect(tablesSql).toMatch(new RegExp(`create table finance_${table} \\( id uuid primary key`));
    }

    expect(tablesSql.match(/references finance_companies\(id\)/g)?.length).toBeGreaterThanOrEqual(10);
    expect(tablesSql.match(/timestamptz not null default now\(\)/g)?.length).toBeGreaterThanOrEqual(10);
    expect(tablesSql.match(/numeric\(15,2\)/g)?.length).toBeGreaterThanOrEqual(8);
    expect(tablesSql).toContain('before_value jsonb');
    expect(tablesSql).toContain('after_value jsonb');
  });

  it('enforces positive monetary values and FK integrity at migration level', () => {
    for (const column of ['amount', 'annual_budget', 'monthly_budget', 'projected_amount']) {
      expect(tablesSql).toContain(column);
    }

    expect(tablesSql.match(/check \([^)]*(amount|budget|projected_amount)[^)]*(>|>=) 0[^)]*\)/g)?.length).toBeGreaterThanOrEqual(7);
    expect(tablesSql).toContain('supplier_id uuid references finance_suppliers(id)');
    expect(tablesSql).toContain('cost_center_id uuid references finance_cost_centers(id)');
    expect(tablesSql).toContain('payable_id uuid not null references finance_payables(id)');
  });

  it('enables RLS and scopes reads and mutations by authenticated company', () => {
    expect(rlsSql).toContain('create or replace function finance_current_company_id()');
    expect(rlsSql).toContain('auth.jwt()');
    expect(rlsSql).not.toContain('using (true)');
    expect(rlsSql).not.toContain('placeholder');

    for (const table of financeTables) {
      expect(rlsSql).toContain(`alter table finance_${table} enable row level security`);
    }

    expect(rlsSql).toContain('using (id = finance_current_company_id())');

    for (const table of companyScopedTables) {
      expect(rlsSql).toContain(`on finance_${table} for all`);
      expect(rlsSql).toContain('with check (company_id = finance_current_company_id())');
    }

    expect(rlsSql).toContain('on finance_approval_flows for all');
    expect(rlsSql).toContain('finance_payables.company_id = finance_current_company_id()');
  });

  it('keeps audit_log append-only and trigger-controlled', () => {
    expect(rlsSql).toContain('on finance_audit_log for select');
    expect(rlsSql).toContain('on finance_audit_log for insert');
    expect(rlsSql).toContain('pg_trigger_depth() > 0');
    expect(rlsSql).not.toContain('on finance_audit_log for update');
    expect(rlsSql).not.toContain('on finance_audit_log for delete');

    expect(triggersSql).toContain('before update or delete on finance_audit_log');
    expect(triggersSql).toContain('raise exception');
  });

  it('audits receivables and payables mutations once with before and after JSON snapshots', () => {
    expect(triggersSql.match(/create trigger trg_audit_receivables/g)?.length).toBe(1);
    expect(triggersSql.match(/create trigger trg_audit_payables/g)?.length).toBe(1);
    expect(triggersSql).toContain('after insert or update on finance_receivables');
    expect(triggersSql).toContain('after insert or update on finance_payables');
    expect(triggersSql.match(/before_value, after_value/g)?.length).toBe(2);
    expect(triggersSql.match(/to_jsonb\(old\), to_jsonb\(new\)/g)?.length).toBe(2);
  });
});
