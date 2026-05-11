import { SalesDashboard } from './_components/SalesDashboard';
import {
  getSalesTestCompanyIds,
  getDashboardKpis,
  listPartners,
  listEspacos,
  listAnomalies,
  listMediaKits,
} from '@/lib/sales/store';

export default function SalesPage() {
  const { alpha, user } = getSalesTestCompanyIds();
  const context = { companyId: alpha, moduleSource: 'fbr-portal', userId: user };
  
  const kpis = getDashboardKpis(context);
  const partners = listPartners(context, { page_size: 100 }).items;
  const espacos = listEspacos(context);
  const anomalias = listAnomalies(context, { status: 'pendente_revisao' });
  const mediaKits = listMediaKits(context);

  return (
    <SalesDashboard
      initialKpis={kpis}
      initialPartners={partners}
      initialEspacos={espacos}
      initialAnomalias={anomalias}
      initialMediaKits={mediaKits}
    />
  );
}