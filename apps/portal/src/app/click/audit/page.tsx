import { clickHistory } from '@/lib/click/fixtures';
import { AuditShell } from './AuditShell';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Audit Log | FBR-Click' };

export default function AuditPage() {
  return <AuditShell history={clickHistory} />;
}
