import { getClickPageContext } from '@/lib/click/context';
import { listAudit } from '@/lib/click/store';
import { AuditShell } from './AuditShell';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Audit Log | FBR-Click' };

export default async function AuditPage() {
  const context = await getClickPageContext();
  return <AuditShell history={listAudit(context)} />;
}
