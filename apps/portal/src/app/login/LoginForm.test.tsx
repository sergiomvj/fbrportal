import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginForm } from './LoginForm';

const replace = vi.fn();
const refresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, refresh }),
  useSearchParams: () => new URLSearchParams('callbackUrl=/click'),
}));

describe('LoginForm', () => {
  beforeEach(() => {
    replace.mockClear();
    refresh.mockClear();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true }),
    );
  });

  it('renders accessible labels and submits with Enter/click behavior', async () => {
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'operator@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'secret' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/click'));
    expect(refresh).toHaveBeenCalled();
  });

  it('shows a generic invalid-credentials error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'operator@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'bad' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Credenciais invalidas.');
  });
});
