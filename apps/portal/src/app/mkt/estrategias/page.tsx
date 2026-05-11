import '../mkt.css';
import { EstrategiasShell } from './EstrategiasShell';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Estrategias | FBR-MKT' };

export default function EstrategiasPage() {
  return <EstrategiasShell />;
}
