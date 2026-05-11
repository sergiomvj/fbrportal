import { SocialDashboard } from './_components/SocialDashboard';
import './social.css';
import { getDashboardSnapshot, getSocialTestCompanyIds } from '@/lib/social/store';

export default function SocialPage() {
  const { alpha, user } = getSocialTestCompanyIds();
  const context = { companyId: alpha, moduleSource: 'fbr-portal', userId: user, role: 'admin' };
  const dashboard = getDashboardSnapshot(context);

  return <SocialDashboard initialDashboard={dashboard} />;
}
