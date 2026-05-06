import { ProfitLossTable } from '../_components/ProfitLossTable';
import { getFinanceTestCompanyIds, getProfitLoss } from '@/lib/finance/store';
import '../finance.css';

export default function FinanceProfitLossPage() {
  const { alpha, user } = getFinanceTestCompanyIds();
  const context = { companyId: alpha, moduleSource: 'fbr-portal', userId: user };
  const pl = getProfitLoss(context, alpha);

  return <ProfitLossTable initialPL={pl} />;
}
