import { PayablesDashboard } from '../_components/PayablesDashboard';
import { getFinanceProxyHeaders, getFinanceTestCompanyIds, listPayables } from '@/lib/finance/store';
import '../finance.css';

export default function FinancePayablesPage() {
  const { alpha, user } = getFinanceTestCompanyIds();
  const context = { companyId: alpha, moduleSource: 'fbr-portal', userId: user };
  const payables = listPayables(context, { page_size: 100 }).items;

  return <PayablesDashboard initialPayables={payables} proxyHeaders={getFinanceProxyHeaders(alpha, user)} />;
}
