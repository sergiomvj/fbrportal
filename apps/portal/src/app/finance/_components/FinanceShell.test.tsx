import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FinanceShell } from './FinanceShell';

describe('FinanceShell', () => {
  it('renders finance hero KPIs and module navigation links', () => {
    render(<FinanceShell />);

    expect(screen.getByRole('heading', { name: 'Operacao financeira governada por agentes' })).toBeInTheDocument();
    expect(screen.getByText('100% integrados')).toBeInTheDocument();
    expect(screen.getByText('N empresas')).toBeInTheDocument();
    expect(screen.getByText('0 transacoes sem rastreio')).toBeInTheDocument();
    expect(screen.getByText('24h SLA')).toBeInTheDocument();

    const modules = screen.getByLabelText('Modulos Finance');
    ['Recebimentos', 'Pagamentos', 'Centro de Custo', 'Conciliacao', 'Forecasting', 'Auditoria'].forEach((name) => {
      expect(within(modules).getByRole('link', { name: new RegExp(name) })).toHaveAttribute(
        'href',
        `/finance/${name === 'Centro de Custo' ? 'centro-custo' : name.toLowerCase()}`,
      );
    });
  });

  it('renders seven finance agent slots and wires AgentPicker finance filters', () => {
    render(<FinanceShell />);

    const agentSection = screen.getByLabelText('Slots de agentes Finance');
    ['Vault', 'Intake', 'Payout', 'Ledger', 'Reconcile', 'Oracle', 'Sentinel'].forEach((name) => {
      expect(within(agentSection).getByText(name)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Incluir Agente' }));
    const dialog = screen.getByRole('dialog', { name: 'Incluir Agente' });

    expect(within(dialog).getByRole('button', { name: 'financeiro' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'contabilidade' })).toBeInTheDocument();
    expect(within(dialog).getByText('Vault')).toBeInTheDocument();
    expect(within(dialog).queryByText('Suporte IA')).not.toBeInTheDocument();
  });

  it('renders integrations and governance display rows', () => {
    render(<FinanceShell />);

    const integrations = screen.getByLabelText('Integracoes Finance');
    ['FBR-Sales', 'Click', 'Dev', 'Suporte', 'Leads', 'Players Externos', 'Bancos/Fintechs'].forEach((source) => {
      expect(within(integrations).getByRole('row', { name: new RegExp(source) })).toBeInTheDocument();
    });

    const governance = screen.getByLabelText('Governanca Finance');
    ['<= R$500', 'R$500-5k', '> R$5k', 'CFO', 'Gestor', 'Analista', 'Auditor', 'Owner'].forEach((item) => {
      expect(within(governance).getAllByText(item).length).toBeGreaterThan(0);
    });
  });
});
