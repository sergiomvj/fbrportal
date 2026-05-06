import { ReconciliationDashboard } from '../_components/ReconciliationDashboard';
import { getFinanceTestCompanyIds, listPendingReconciliation } from '@/lib/finance/store';
import '../finance.css';

export default function FinanceReconciliationPage() {
  const { alpha, user } = getFinanceTestCompanyIds();
  const context = { companyId: alpha, moduleSource: 'fbr-portal', userId: user };
  const pendingItems = listPendingReconciliation(context);

  return <ReconciliationDashboard initialPendingItems={pendingItems} />;
}
