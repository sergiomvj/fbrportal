import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { getDashboardSnapshot, getSocialTestCompanyIds } from '@/lib/social/store';
import { SocialDashboard } from './SocialDashboard';

function renderDashboard() {
  const { alpha, user } = getSocialTestCompanyIds();
  const dashboard = getDashboardSnapshot({ companyId: alpha, moduleSource: 'fbr-portal', userId: user, role: 'admin' });
  return render(<SocialDashboard initialDashboard={dashboard} />);
}

describe('SocialDashboard', () => {
  it('renders hero KPIs and all eight supported networks', () => {
    renderDashboard();

    expect(screen.getByRole('heading', { name: /Visual production governada por formatos reais/i })).toBeInTheDocument();
    expect(screen.getByText('Jobs hoje')).toBeInTheDocument();
    expect(screen.getByText('Formatos suportados')).toBeInTheDocument();

    ['Instagram', 'Facebook', 'LinkedIn', 'TikTok', 'Twitter/X', 'YouTube', 'Pinterest', 'WhatsApp'].forEach((network) => {
      expect(screen.getAllByText(network).length).toBeGreaterThan(0);
    });
  });

  it('opens AgentPicker with Social tags and hides unrelated agents by default filter', () => {
    renderDashboard();

    fireEvent.click(screen.getByRole('button', { name: 'Incluir Agente' }));
    const dialog = screen.getByRole('dialog', { name: 'Incluir Agente' });

    expect(within(dialog).getByRole('button', { name: 'social media' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'design' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'conteudo visual' })).toBeInTheDocument();
    expect(within(dialog).getByText('Compositor')).toBeInTheDocument();
    expect(within(dialog).queryByText('Suporte IA')).not.toBeInTheDocument();
  });

  it('renders the eight-step pipeline', () => {
    renderDashboard();

    expect(screen.getByText('8 passos da producao ate o storage')).toBeInTheDocument();
    ['Recebimento', 'Brand Kit', 'Templates', 'Assets', 'Composicao HTML/CSS', 'Render', 'Quality Check', 'Storage + ZIP'].forEach((step) => {
      expect(screen.getAllByText(step).length).toBeGreaterThan(0);
    });
  });

  it('shows the selected job package preview in the side panel', () => {
    renderDashboard();

    expect(screen.getByText('ZIP package')).toBeInTheDocument();
    expect(screen.getByText(/_social\.zip$/i)).toBeInTheDocument();
    expect(screen.getByText(/arquivos/i)).toBeInTheDocument();
  });
});
