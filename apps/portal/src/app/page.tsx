import { getSession } from '@fbr/auth';

export default async function HomePage() {
  const session = await getSession();

  return (
    <main className="portal-home">
      <p className="eyebrow">FBR Portal</p>
      <h1>Base autenticada pronta</h1>
      <p>Operador: {session?.email ?? 'sessao pendente'}</p>
    </main>
  );
}
