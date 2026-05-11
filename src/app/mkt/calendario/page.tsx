import '../mkt.css';
import { CalendarioShell } from './CalendarioShell';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Calendario 90 dias | FBR-MKT' };

export default function CalendarioPage() {
  return <CalendarioShell />;
}
