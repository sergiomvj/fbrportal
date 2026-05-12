import { SocialDashboard } from './_components/SocialDashboard';
import './social.css';
import { getSocialDashboardFromPortal } from '@/lib/social/portal-api';

export default async function SocialPage() {
  const dashboard = await getSocialDashboardFromPortal();

  return <SocialDashboard initialDashboard={dashboard} />;
}
