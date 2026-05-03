'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { loginSchema, type LoginInput } from '@/lib/validators/auth';
import './login.css';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: LoginInput) {
    setFormError(null);
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      setFormError('Credenciais invalidas.');
      return;
    }

    const callbackUrl = searchParams.get('callbackUrl') || '/';
    router.replace(callbackUrl.startsWith('/') ? callbackUrl : '/');
    router.refresh();
  }

  return (
    <form className="login-form" onSubmit={handleSubmit(onSubmit)}>
      <label htmlFor="email">E-mail</label>
      <input
        id="email"
        type="email"
        autoComplete="email"
        aria-invalid={Boolean(errors.email)}
        {...register('email')}
      />
      {errors.email ? <p role="alert">{errors.email.message}</p> : null}

      <label htmlFor="password">Senha</label>
      <input
        id="password"
        type="password"
        autoComplete="current-password"
        aria-invalid={Boolean(errors.password)}
        {...register('password')}
      />
      {errors.password ? <p role="alert">{errors.password.message}</p> : null}

      {formError ? <p role="alert">{formError}</p> : null}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
}
