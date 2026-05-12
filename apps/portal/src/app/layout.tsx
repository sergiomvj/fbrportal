import type { Metadata } from 'next';
import '@fbr/ui/styles.css';
import './styles.css';
import { PortalOraculoShell } from './_components/PortalOraculoShell';

export const metadata: Metadata = {
  title: 'FBR Portal',
  description: 'FBR Portal authenticated operator interface',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <PortalOraculoShell>{children}</PortalOraculoShell>
      </body>
    </html>
  );
}
