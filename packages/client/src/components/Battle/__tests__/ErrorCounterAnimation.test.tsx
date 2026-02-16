import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ErrorCounterAnimation } from '../ErrorCounterAnimation';

describe('ErrorCounterAnimation', () => {
  it('renders with error message', () => {
    render(<ErrorCounterAnimation message="反撃！" damage={10} onComplete={vi.fn()} />);
    expect(screen.getByTestId('error-counter')).toBeInTheDocument();
  });

  it('shows damage amount', () => {
    render(<ErrorCounterAnimation message="反撃！" damage={15} onComplete={vi.fn()} />);
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('applies red flash style', () => {
    render(<ErrorCounterAnimation message="反撃！" damage={10} onComplete={vi.fn()} />);
    const el = screen.getByTestId('error-counter');
    expect(el.className).toContain('error-counter');
  });
});
