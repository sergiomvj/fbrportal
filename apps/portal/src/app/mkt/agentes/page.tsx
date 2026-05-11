import '../mkt.css';
import { AgentesShell } from './AgentesShell';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Agentes | FBR-MKT' };

export default function AgentesPage() {
  return <AgentesShell />;
}
