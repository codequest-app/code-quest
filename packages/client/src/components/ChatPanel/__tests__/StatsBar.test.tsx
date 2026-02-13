import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatsBar } from '../StatsBar';

describe('StatsBar', () => {
  it('should render all stats fields', () => {
    render(
      <StatsBar stats={{ costUsd: 0.001, durationMs: 1500, inputTokens: 100, outputTokens: 50 }} />,
    );

    const bar = screen.getByTestId('stats-bar');
    expect(bar).toHaveTextContent('$0.0010');
    expect(bar).toHaveTextContent('1.5s');
    expect(bar).toHaveTextContent('100 in');
    expect(bar).toHaveTextContent('50 out');
  });

  it('should join stats with dot separator', () => {
    render(<StatsBar stats={{ costUsd: 0.002, durationMs: 3000 }} />);

    expect(screen.getByTestId('stats-bar')).toHaveTextContent('$0.0020 · 3.0s');
  });

  it('should render only provided stats', () => {
    render(<StatsBar stats={{ costUsd: 0.005 }} />);

    const bar = screen.getByTestId('stats-bar');
    expect(bar).toHaveTextContent('$0.0050');
    expect(bar).not.toHaveTextContent('·');
  });

  it('should return null when no stats provided', () => {
    const { container } = render(<StatsBar stats={{}} />);

    expect(container.innerHTML).toBe('');
  });

  it('should format cost to 4 decimal places', () => {
    render(<StatsBar stats={{ costUsd: 0.1 }} />);

    expect(screen.getByTestId('stats-bar')).toHaveTextContent('$0.1000');
  });

  it('should format duration in seconds with 1 decimal', () => {
    render(<StatsBar stats={{ durationMs: 12345 }} />);

    expect(screen.getByTestId('stats-bar')).toHaveTextContent('12.3s');
  });
});
