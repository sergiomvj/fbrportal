import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { clickAgents, clickDeals, clickHistory, clickMessages, clickTasks } from '@/lib/click/fixtures';
import { AgentDashboard } from './AgentDashboard';
import { CreateDealModal } from './CreateDealModal';
import { DealCard } from './DealCard';
import { DealDetail } from './DealDetail';
import { MessagesPanel } from './MessagesPanel';
import { PipelineBoard } from './PipelineBoard';
import { Timeline } from './Timeline';

describe('Click components', () => {
  it('renders pipeline stage columns and emits stage move intent', () => {
    const onMove = vi.fn();
    render(<PipelineBoard deals={clickDeals} onMove={onMove} onOpen={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Contato Inicial' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Fechamento' })).toBeInTheDocument();
    expect(screen.getByText('Acme Vendas')).toBeInTheDocument();
  });

  it('renders deal card essentials and click navigation intent', () => {
    const onOpen = vi.fn();
    render(<DealCard deal={clickDeals[0]!} onOpen={onOpen} />);

    fireEvent.click(screen.getByRole('button', { name: /Acme Vendas/i }));
    expect(screen.getByText('FBR-Leads')).toBeInTheDocument();
    expect(screen.getByLabelText('Score 86')).toBeInTheDocument();
    expect(onOpen).toHaveBeenCalledWith(clickDeals[0]!);
  });

  it('keeps create modal open with inline validation errors', () => {
    render(<CreateDealModal open onClose={vi.fn()} onCreate={vi.fn(async () => clickDeals[0]!)} />);

    expect(screen.getByLabelText('Origem')).toHaveValue('manual');
    fireEvent.change(screen.getByLabelText('Origem'), { target: { value: 'fbr_leads' } });
    expect(screen.getByLabelText('Origem')).toHaveValue('fbr_leads');

    fireEvent.click(screen.getByRole('button', { name: 'Criar deal' }));

    expect(screen.getByText('Informe o titulo do deal.')).toBeInTheDocument();
    expect(screen.getByText('Informe a empresa.')).toBeInTheDocument();
  });

  it('renders deal detail tabs for timeline, messages, and tasks', () => {
    render(
      <DealDetail
        deal={clickDeals[0]!}
        documents={[{ id: 'doc-1', name: 'diagnostico.pdf', mimeType: 'application/pdf', createdAt: new Date().toISOString() }]}
        dispositionLabel="Em andamento"
        history={clickHistory}
        messages={clickMessages}
        onMessage={vi.fn()}
        onMove={vi.fn()}
        tasks={clickTasks}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Messages' }));
    expect(screen.getByLabelText('Mensagens do deal')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tasks' }));
    expect(screen.getByText(/Enviar diagnostico/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Docs' }));
    expect(screen.getByLabelText('Documentos do deal')).toBeInTheDocument();
  });

  it('supports Enter-to-send and mention autocomplete in messages', () => {
    const onSend = vi.fn();
    render(<MessagesPanel messages={clickMessages} onSend={onSend} />);
    const input = screen.getByLabelText('Nova mensagem');

    fireEvent.change(input, { target: { value: '@' } });
    expect(screen.getByLabelText('Autocomplete de mencoes')).toBeInTheDocument();
    fireEvent.change(input, { target: { value: '@sdr revisar' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onSend).toHaveBeenCalledWith('@sdr revisar');
  });

  it('renders immutable timeline actor badges and timestamps', () => {
    render(<Timeline events={clickHistory} />);

    expect(screen.getByLabelText('Timeline auditavel')).toHaveTextContent('Deal criado');
    expect(screen.getAllByText(/human/).length).toBeGreaterThanOrEqual(1);
  });

  it('renders six agent slots and keeps kill switch admin-only', () => {
    render(<AgentDashboard agents={clickAgents} companyId="empresa-1" isAdmin={false} />);

    expect(screen.getAllByRole('article')).toHaveLength(9);
    expect(screen.getByText('sdr')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Kill switch|Retomar/ }).every((button) => button.hasAttribute('disabled'))).toBe(true);
    expect(within(screen.getByLabelText('Dashboard de agentes Click')).getByText('Agentes Click')).toBeInTheDocument();
  });

  it('wires agent kill switch controls for admins', () => {
    const onAgentPausedChange = vi.fn();
    render(<AgentDashboard agents={clickAgents} companyId="empresa-1" isAdmin onAgentPausedChange={onAgentPausedChange} />);

    const button = screen.getAllByRole('button', { name: 'Kill switch' })[0]!;
    fireEvent.click(button);

    expect(onAgentPausedChange).toHaveBeenCalledWith(expect.objectContaining({ slot: 'sdr' }), true);
    expect(button).toHaveTextContent('Retomar');
  });
});
