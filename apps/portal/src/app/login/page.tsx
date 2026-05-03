import { Suspense } from 'react';
import { LoginForm } from './LoginForm';

export default function LoginPage() {
  return (
    <main className="login-shell">
      <section className="login-card" aria-labelledby="login-title">
        <p className="eyebrow">FBR Portal</p>
        <h1 id="login-title">Acesso operacional</h1>
        <p className="login-copy">
          Entre com sua conta para acessar os modulos do portal com sessao segura.
        </p>
        <Suspense fallback={<p>Carregando formulario...</p>}>
          <LoginForm />
        </Suspense>
      </section>
    </main>
  );
}
