-- Migration: Create Finance Tables
-- Date: 2026-04-01
-- Story: 1.4.2
-- Required Finance table coverage:
-- companies -> finance_companies
-- cost_centers -> finance_cost_centers
-- transactions -> finance_transactions
-- receivables -> finance_receivables
-- payables -> finance_payables
-- bank_accounts -> finance_bank_accounts
-- bank_statements -> finance_bank_statements
-- reconciliation_items -> finance_reconciliation_items
-- budgets -> finance_budgets
-- suppliers -> finance_suppliers
-- approval_flows -> finance_approval_flows
-- forecasts -> finance_forecasts
-- audit_log -> finance_audit_log
-- agent_actions -> finance_agent_actions
--
-- SPEC baseline mapping:
-- empresas_financeiras -> finance_companies
-- recebimentos -> finance_receivables
-- pagamentos -> finance_payables
-- audit_financeiro -> finance_audit_log

-- 1. Companies (Finance context)
CREATE TABLE finance_companies (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id     UUID NOT NULL,
  name         TEXT NOT NULL,
  cnpj         TEXT,
  cost_center_base TEXT NOT NULL,
  annual_budget NUMERIC(15,2) DEFAULT 0 CHECK (annual_budget >= 0),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Cost Centers
CREATE TABLE finance_cost_centers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID NOT NULL REFERENCES finance_companies(id),
  name         TEXT NOT NULL,
  description  TEXT,
  monthly_budget NUMERIC(15,2) DEFAULT 0 CHECK (monthly_budget >= 0),
  parent_id    UUID REFERENCES finance_cost_centers(id),
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Suppliers
CREATE TABLE finance_suppliers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID NOT NULL REFERENCES finance_companies(id),
  name         TEXT NOT NULL,
  cnpj         TEXT,
  category     TEXT NOT NULL, -- 'infra'|'ferramenta'|'servico'|'pessoa_fisica'
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Bank Accounts
CREATE TABLE finance_bank_accounts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID NOT NULL REFERENCES finance_companies(id),
  bank_name    TEXT NOT NULL,
  agency       TEXT,
  account_number TEXT,
  credentials_vault_key TEXT, -- Reference to encrypted storage
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Receivables (Recebimentos)
CREATE TABLE finance_receivables (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID NOT NULL REFERENCES finance_companies(id),
  partner_name TEXT NOT NULL,
  amount       NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  currency     TEXT DEFAULT 'BRL',
  expected_date DATE NOT NULL,
  received_date DATE,
  status       TEXT DEFAULT 'pending', -- 'pending'|'received'|'overdue'|'divergent'
  statement_ref TEXT,
  created_by   UUID, -- References auth.users(id)
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Payables (Pagamentos)
CREATE TABLE finance_payables (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID NOT NULL REFERENCES finance_companies(id),
  supplier_id  UUID REFERENCES finance_suppliers(id),
  amount       NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  due_date     DATE NOT NULL,
  payment_date DATE,
  status       TEXT DEFAULT 'pending', -- 'pending'|'approved'|'paid'|'rejected'
  is_recurring BOOLEAN DEFAULT FALSE,
  cost_center_id UUID REFERENCES finance_cost_centers(id),
  approved_by  UUID, -- References auth.users(id)
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Transactions (Unified table)
CREATE TABLE finance_transactions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID NOT NULL REFERENCES finance_companies(id),
  type         TEXT NOT NULL, -- 'inbound'|'outbound'
  amount       NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  description  TEXT,
  reference_id UUID, -- Link to receivable or payable
  reference_type TEXT, -- 'receivable'|'payable'
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Bank Statements (Extratos)
CREATE TABLE finance_bank_statements (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID NOT NULL REFERENCES finance_companies(id),
  bank_account_id UUID REFERENCES finance_bank_accounts(id),
  movement_date DATE NOT NULL,
  description  TEXT NOT NULL,
  amount       NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  type         TEXT NOT NULL, -- 'credit'|'debit'
  is_reconciled BOOLEAN DEFAULT FALSE,
  reference_id UUID, -- Link to reconciliation record
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Reconciliation Items
CREATE TABLE finance_reconciliation_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID NOT NULL REFERENCES finance_companies(id),
  statement_id UUID NOT NULL REFERENCES finance_bank_statements(id),
  reference_type TEXT NOT NULL, -- 'receivable'|'payable'
  reference_id   UUID NOT NULL,
  match_score    NUMERIC(5,2) NOT NULL,
  method         TEXT NOT NULL, -- 'automatic'|'manual'
  approved_by    UUID, -- References auth.users(id)
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Budgets
CREATE TABLE finance_budgets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID NOT NULL REFERENCES finance_companies(id),
  cost_center_id UUID REFERENCES finance_cost_centers(id),
  year         INT NOT NULL,
  month        INT, -- Optional if annual
  amount       NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Approval Flows
CREATE TABLE finance_approval_flows (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payable_id    UUID NOT NULL REFERENCES finance_payables(id),
  level         INT NOT NULL,
  approver_id   UUID, -- References auth.users(id)
  status        TEXT DEFAULT 'pending', -- 'pending'|'approved'|'rejected'
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at  TIMESTAMPTZ
);

-- 12. Forecasts
CREATE TABLE finance_forecasts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES finance_companies(id),
  base_date     DATE NOT NULL,
  period        TEXT NOT NULL, -- '30d'|'60d'|'90d'
  projected_amount NUMERIC(15,2) NOT NULL CHECK (projected_amount > 0),
  scenario      TEXT NOT NULL, -- 'optimistic'|'base'|'pessimistic'
  actual_amount NUMERIC(15,2) CHECK (actual_amount IS NULL OR actual_amount >= 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Audit Log (Append-only)
CREATE TABLE finance_audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL,
  entity_type TEXT NOT NULL, -- 'receivable'|'payable'|'reconciliation'|'budget'
  entity_id   UUID NOT NULL,
  actor_type  TEXT NOT NULL, -- 'human'|'agent'
  actor_id    TEXT NOT NULL,
  action      TEXT NOT NULL,
  before_value JSONB,
  after_value  JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Agent Actions
CREATE TABLE finance_agent_actions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES finance_companies(id),
  agent_id    TEXT NOT NULL, -- Reference to Arva agent id
  action_type TEXT NOT NULL,
  result      TEXT,
  confidence  NUMERIC(5,2),
  is_approved BOOLEAN DEFAULT FALSE,
  approved_by UUID, -- References auth.users(id)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT finance_agent_actions_confidence_range CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 100)
);
