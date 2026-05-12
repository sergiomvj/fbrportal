import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const usePathname = vi.hoisted(() => vi.fn());
const useSession = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  usePathname,
}));

vi.mock('@fbr/auth/client', () => ({
  useSession,
}));

describe('PortalOraculoShell', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    usePathname.mockReturnValue('/leads/pipeline');
    useSession.mockReturnValue({
      user: { email: 'operator@example.com', role: 'operator', empresaId: 'empresa-1' },
      isLoading: false,
      error: null,
    });
    window.localStorage.clear();
  });

  it('toggles the panel and renders contextual suggestions', async () => {
    const { PortalOraculoShell } = await import('./PortalOraculoShell');

    render(
      <PortalOraculoShell>
        <main>Portal content</main>
      </PortalOraculoShell>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Oraculo/i }));

    expect(await screen.findByRole('heading', { name: 'Oraculo' })).toBeInTheDocument();
    expect(screen.getAllByText('FBR-Leads').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Por que um lead trava no scoring?' })).toBeInTheDocument();
  });

  it('persists the open state and submits contextual queries', async () => {
    const { PortalOraculoShell } = await import('./PortalOraculoShell');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        answer: 'Baseei esta resposta em fontes reais.',
        context: {
          module: 'leads',
          moduleLabel: 'FBR-Leads',
          screen: 'pipeline',
          screenLabel: 'Pipeline',
          pathname: '/leads/pipeline',
          suggestedQuestions: [],
        },
        sources: [
          {
            filePath: 'apps/portal/src/app/leads/_components/LeadsPipeline.tsx',
            title: 'apps/portal/src/app/leads/_components/LeadsPipeline.tsx',
            lineStart: 10,
            lineEnd: 12,
            excerpt: 'const step = "pipeline";',
          },
        ],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <PortalOraculoShell>
        <main>Portal content</main>
      </PortalOraculoShell>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Oraculo/i }));
    fireEvent.change(screen.getByLabelText('Pergunte sobre o sistema'), {
      target: { value: 'Como funciona o pipeline?' },
    });
    fireEvent.submit(screen.getByRole('button', { name: 'Consultar' }).closest('form')!);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/oraculo/query',
        expect.objectContaining({
          method: 'POST',
        }),
      );
    });

    expect(await screen.findByText('Baseei esta resposta em fontes reais.')).toBeInTheDocument();
    expect(window.localStorage.getItem('fbr:oraculo:open')).toBe('true');
  });
});
