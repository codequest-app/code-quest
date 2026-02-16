import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useBankStore } from '../../../stores/bankStore';
import { BankPanel } from '../BankPanel';

describe('BankPanel', () => {
  beforeEach(() => {
    localStorage.clear();
    useBankStore.setState({
      sessionCosts: new Map(),
      totalCost: 0,
      budget: undefined,
    });
  });

  it('renders total gold spent', () => {
    useBankStore.getState().recordCost('s1', 'haiku', 0.05);
    render(<BankPanel />);
    expect(screen.getByTestId('total-gold')).toHaveTextContent('50');
  });

  it('renders total cost in USD', () => {
    useBankStore.getState().recordCost('s1', 'sonnet', 0.1);
    render(<BankPanel />);
    expect(screen.getByTestId('total-cost')).toHaveTextContent('$0.10');
  });

  it('shows per-model breakdown', () => {
    useBankStore.getState().recordCost('s1', 'haiku', 0.01);
    useBankStore.getState().recordCost('s1', 'opus', 0.1);
    render(<BankPanel />);
    expect(screen.getByTestId('bank-panel')).toBeInTheDocument();
  });

  it('shows budget warning when near limit', () => {
    useBankStore.getState().setBudget(0.5);
    useBankStore.getState().recordCost('s1', 'opus', 0.45);
    render(<BankPanel />);
    expect(screen.getByTestId('budget-warning')).toBeInTheDocument();
  });

  it('does not show budget warning when under limit', () => {
    useBankStore.getState().setBudget(10);
    useBankStore.getState().recordCost('s1', 'haiku', 0.01);
    render(<BankPanel />);
    expect(screen.queryByTestId('budget-warning')).not.toBeInTheDocument();
  });

  it('renders zero state', () => {
    render(<BankPanel />);
    expect(screen.getByTestId('total-gold')).toHaveTextContent('0');
  });
});
