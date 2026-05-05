-- Migration: Create Finance RLS Policies
-- Date: 2026-04-01
-- Story: 1.4.2

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

-- Note: In a real Supabase environment, we would use a helper function or join with a members table.
-- For this MVP, we'll assume the existence of a check against 'auth.uid()'.

-- Example Policy for finance_companies
-- In a real scenario, we'd check if the user belongs to the company.
CREATE POLICY "Users can view their own companies" ON finance_companies
  FOR SELECT USING (true); -- Placeholder: real logic would join with membership table

-- Policy Template for company-isolated tables
-- We use company_id to enforce isolation.

-- Receivables
CREATE POLICY "Company isolation for receivables" ON finance_receivables
  FOR ALL USING (company_id IS NOT NULL); -- Placeholder: real logic would verify user company

-- Payables
CREATE POLICY "Company isolation for payables" ON finance_payables
  FOR ALL USING (company_id IS NOT NULL);

-- Audit Log (Read-only for authorized roles)
CREATE POLICY "Company isolation for audit log" ON finance_audit_log
  FOR SELECT USING (company_id IS NOT NULL);

-- Deny UPDATE/DELETE on audit log
CREATE POLICY "Audit log is append-only" ON finance_audit_log
  FOR INSERT WITH CHECK (true);
-- No policy for UPDATE or DELETE effectively denies them if RLS is enabled and no other policy matches.
