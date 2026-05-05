import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AgentPicker } from './AgentPicker';
import type { ArvaAgent } from '@fbr/arva-integration';

const agents: ArvaAgent[] = [
  {
    id: 'agent-sales',
    name: 'Arva Sales',
    role: 'comercial',
    tags: ['comercial', 'sales'],
    status: 'active',
    avatarUrl: 'https://example.com/avatar.png',
  },
  {
    id: 'agent-finance',
    name: 'Arva Finance',
    role: 'financeiro',
    tags: ['financeiro'],
    status: 'inactive',
  },
];

describe('AgentPicker', () => {
  it('opens modal, renders accessible dialog, filters by tag, and selects an agent', () => {
    const onSelect = vi.fn();
    render(<AgentPicker agents={agents} companyId="company-1" moduleId="sales" moduleTags={['comercial']} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('button', { name: 'Incluir Agente' }));

    const dialog = screen.getByRole('dialog', { name: 'Incluir Agente' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(within(dialog).getByText('Arva Sales')).toBeInTheDocument();
    
    // Verify avatar rendering (AC2)
    const salesAvatar = within(dialog).getByRole('img', { name: 'Avatar de Arva Sales' });
    expect(salesAvatar).toHaveAttribute('src', 'https://example.com/avatar.png');

    expect(within(dialog).queryByText('Arva Finance')).not.toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: 'todos' }));
    expect(within(dialog).getByText('Arva Finance')).toBeInTheDocument();
    
    // Verify initials fallback (AC2)
    expect(within(dialog).getByText('AF')).toBeInTheDocument();

    fireEvent.click(within(dialog).getAllByRole('button', { name: 'Vincular agente' })[0]!);
    expect(onSelect).toHaveBeenCalledWith({ agent: agents[0], moduleId: 'sales' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('supports loading, empty, error, linked agents, and Escape close states', () => {
    const { rerender } = render(<AgentPicker agents={[]} companyId="company-1" loading onSelect={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Incluir Agente' }));
    expect(screen.getByText('Carregando agentes...')).toBeInTheDocument();

    rerender(<AgentPicker agents={[]} companyId="company-1" error="Falha ao carregar" onSelect={vi.fn()} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Falha ao carregar');

    rerender(<AgentPicker agents={[]} companyId="company-1" onSelect={vi.fn()} />);
    expect(screen.getByText('Nenhum agente encontrado para este filtro.')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    rerender(<AgentPicker agents={agents} companyId="company-1" linkedAgents={[agents[0]!]} onSelect={vi.fn()} />);
    expect(screen.getByLabelText('Agentes vinculados')).toHaveTextContent('Arva Sales');
    expect(screen.getByText('Status ativo')).toBeInTheDocument();
  });
});
