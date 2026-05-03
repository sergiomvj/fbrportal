import type { Metadata } from 'next';
import './styles.css';

export const metadata: Metadata = {
  title: 'FBR Portal',
  description: 'FBR Portal authenticated operator interface',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
