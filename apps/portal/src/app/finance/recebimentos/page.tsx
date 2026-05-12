import { ReceivablesDashboard } from '../_components/ReceivablesDashboard';
import { getDashboardKpis, getFinanceProxyHeaders, getFinanceTestCompanyIds, listReceivables } from '@/lib/finance/store';
import '../finance.css';

export default function FinanceReceivablesPage() {
  const { alpha, user } = getFinanceTestCompanyIds();
  const context = { companyId: alpha, moduleSource: 'fbr-portal', userId: user };
  const receivables = listReceivables(context, { page_size: 100 }).items;

  return <ReceivablesDashboard initialKpis={getDashboardKpis(context)} initialReceivables={receivables} proxyHeaders={getFinanceProxyHeaders(alpha, user)} />;
}
