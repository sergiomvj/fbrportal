import { getSession } from '@fbr/auth';
import Link from 'next/link';

const modules = [
  { href: '/finance', label: 'FBR-Finance', description: 'Recebimentos, pagamentos, conciliacao, centros de custo, P&L, forecast, auditoria' },
  { href: '/click', label: 'FBR-Click', description: 'CRM, pipeline de vendas, deals, agentes comerciais' },
  { href: '/leads', label: 'FBR-Leads', description: 'Inteligencia de prospeccao e outbound' },
  { href: '/mkt', label: 'FBR-MKT', description: 'Inteligencia de marketing e campanhas' },
  { href: '/redacao', label: 'FBR-Redacao', description: 'Newsroom, redacao e publicacao de conteudo' },
  { href: '/sales', label: 'FBR-Sales', description: 'Operacoes de receita e vendas' },
  { href: '/social', label: 'FBR-Social', description: 'Producao visual e gestao de redes sociais' },
  { href: '/videoflow', label: 'FBR-VideoFlow', description: 'Producao e distribuicao de video' },
  { href: '/design', label: 'FBR-Design', description: 'Design grafico e identidade visual' },
];

export default async function HomePage() {
  const session = await getSession();

  return (
    <main className="portal-home">
      <div className="portal-header">
        <p className="eyebrow">FBR Portal</p>
        <h1>Base autenticada pronta</h1>
        <p>Operador: {session?.email ?? 'sessao pendente'}</p>
      </div>

      <nav className="portal-nav" aria-label="Modulos do portal">
        <h2>Modulos</h2>
        <div className="portal-modules">
          {modules.map((mod) => (
            <Link key={mod.href} href={mod.href} className="portal-module-card">
              <h3>{mod.label}</h3>
              <p>{mod.description}</p>
            </Link>
          ))}
        </div>
      </nav>
    </main>
  );
}
