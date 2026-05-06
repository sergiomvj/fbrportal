import { CostCenterTree } from '../_components/CostCenterTree';
import { getFinanceTestCompanyIds, listCostCenters } from '@/lib/finance/store';
import '../finance.css';

export default function FinanceCostCentersPage() {
  const { alpha, user } = getFinanceTestCompanyIds();
  const context = { companyId: alpha, moduleSource: 'fbr-portal', userId: user };
  const costCenters = listCostCenters(context);

  return <CostCenterTree initialCostCenters={costCenters} />;
}
