import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CostChart } from '../CostChart';

describe('CostChart', () => {
  it('renders with empty sessions', () => {
    render(<CostChart sessionCosts={new Map()} />);
    expect(screen.getByTestId('cost-chart')).toBeInTheDocument();
  });

  it('renders session cost rows', () => {
    const costs = new Map([
      ['s1', { total: 0.05, byModel: { haiku: 0.05 } }],
      ['s2', { total: 0.1, byModel: { sonnet: 0.1 } }],
    ]);
    render(<CostChart sessionCosts={costs} />);
    expect(screen.getAllByTestId(/^cost-row-/)).toHaveLength(2);
  });

  it('shows model breakdown per session', () => {
    const costs = new Map([['s1', { total: 0.06, byModel: { haiku: 0.01, sonnet: 0.05 } }]]);
    render(<CostChart sessionCosts={costs} />);
    expect(screen.getByTestId('cost-row-s1')).toHaveTextContent('$0.06');
  });

  it('shows model icons', () => {
    const costs = new Map([['s1', { total: 0.01, byModel: { haiku: 0.01 } }]]);
    render(<CostChart sessionCosts={costs} />);
    expect(screen.getByTestId('cost-row-s1')).toHaveTextContent('🌸');
  });

  it('shows empty state message when no sessions', () => {
    render(<CostChart sessionCosts={new Map()} />);
    expect(screen.getByText(/No sessions/)).toBeInTheDocument();
  });

  it('sorts sessions by cost descending', () => {
    const costs = new Map([
      ['s1', { total: 0.01, byModel: { haiku: 0.01 } }],
      ['s2', { total: 0.1, byModel: { opus: 0.1 } }],
    ]);
    render(<CostChart sessionCosts={costs} />);
    const rows = screen.getAllByTestId(/^cost-row-/);
    expect(rows[0].dataset.testid).toBe('cost-row-s2');
  });
});
