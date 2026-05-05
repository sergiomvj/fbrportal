-- Migration: Create Finance RLS Policies
-- Date: 2026-04-01
-- Story: 1.4.2

CREATE OR REPLACE FUNCTION finance_current_company_id()
RETURNS UUID AS $$
  SELECT NULLIF(
    COALESCE(
      auth.jwt() -> 'user_metadata' ->> 'empresaId',
      auth.jwt() -> 'app_metadata' ->> 'empresaId',
      auth.jwt() -> 'user_metadata' ->> 'company_id',
      auth.jwt() -> 'app_metadata' ->> 'company_id'
    ),
    ''
  )::UUID;
$$ LANGUAGE SQL STABLE;

ALTER TABLE finance_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_receivables ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_payables ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_bank_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_reconciliation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_approval_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_agent_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company isolation for companies" ON finance_companies
  FOR ALL
  USING (id = finance_current_company_id())
  WITH CHECK (id = finance_current_company_id());

CREATE POLICY "Company isolation for cost centers" ON finance_cost_centers
  FOR ALL
  USING (company_id = finance_current_company_id())
  WITH CHECK (company_id = finance_current_company_id());

CREATE POLICY "Company isolation for suppliers" ON finance_suppliers
  FOR ALL
  USING (company_id = finance_current_company_id())
  WITH CHECK (company_id = finance_current_company_id());

CREATE POLICY "Company isolation for bank accounts" ON finance_bank_accounts
  FOR ALL
  USING (company_id = finance_current_company_id())
  WITH CHECK (company_id = finance_current_company_id());

CREATE POLICY "Company isolation for receivables" ON finance_receivables
  FOR ALL
  USING (company_id = finance_current_company_id())
  WITH CHECK (company_id = finance_current_company_id());

CREATE POLICY "Company isolation for payables" ON finance_payables
  FOR ALL
  USING (company_id = finance_current_company_id())
  WITH CHECK (company_id = finance_current_company_id());

CREATE POLICY "Company isolation for transactions" ON finance_transactions
  FOR ALL
  USING (company_id = finance_current_company_id())
  WITH CHECK (company_id = finance_current_company_id());

CREATE POLICY "Company isolation for bank statements" ON finance_bank_statements
  FOR ALL
  USING (company_id = finance_current_company_id())
  WITH CHECK (company_id = finance_current_company_id());

CREATE POLICY "Company isolation for reconciliation items" ON finance_reconciliation_items
  FOR ALL
  USING (company_id = finance_current_company_id())
  WITH CHECK (company_id = finance_current_company_id());

CREATE POLICY "Company isolation for budgets" ON finance_budgets
  FOR ALL
  USING (company_id = finance_current_company_id())
  WITH CHECK (company_id = finance_current_company_id());

CREATE POLICY "Company isolation for approval flows" ON finance_approval_flows
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM finance_payables
      WHERE finance_payables.id = finance_approval_flows.payable_id
        AND finance_payables.company_id = finance_current_company_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM finance_payables
      WHERE finance_payables.id = finance_approval_flows.payable_id
        AND finance_payables.company_id = finance_current_company_id()
    )
  );

CREATE POLICY "Company isolation for forecasts" ON finance_forecasts
  FOR ALL
  USING (company_id = finance_current_company_id())
  WITH CHECK (company_id = finance_current_company_id());

CREATE POLICY "Company isolation for audit log reads" ON finance_audit_log
  FOR SELECT
  USING (company_id = finance_current_company_id());

CREATE POLICY "Company isolation for audit log inserts" ON finance_audit_log
  FOR INSERT
  WITH CHECK (
    company_id = finance_current_company_id()
    AND pg_trigger_depth() > 0
  );

CREATE POLICY "Company isolation for agent actions" ON finance_agent_actions
  FOR ALL
  USING (company_id = finance_current_company_id())
  WITH CHECK (company_id = finance_current_company_id());
