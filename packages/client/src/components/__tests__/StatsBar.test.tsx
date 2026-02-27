import { render, screen } from '@testing-library/react';
import { StatsBar } from '../StatsBar';

describe('StatsBar', () => {
  it('renders nothing when stats is null', () => {
    const { container } = render(<StatsBar stats={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('displays cost', () => {
    render(<StatsBar stats={{ costUsd: 0.0123 }} />);
    expect(screen.getByText(/\$0\.0123/)).toBeInTheDocument();
  });

  it('displays duration', () => {
    render(<StatsBar stats={{ durationMs: 1500 }} />);
    expect(screen.getByText(/1\.5s/)).toBeInTheDocument();
  });

  it('displays tokens', () => {
    render(<StatsBar stats={{ inputTokens: 100, outputTokens: 200 }} />);
    expect(screen.getByText(/100/)).toBeInTheDocument();
    expect(screen.getByText(/200/)).toBeInTheDocument();
  });

  it('displays all stats together', () => {
    render(
      <StatsBar
        stats={{ costUsd: 0.05, durationMs: 2000, inputTokens: 500, outputTokens: 1000 }}
      />,
    );
    expect(screen.getByText(/\$0\.05/)).toBeInTheDocument();
    expect(screen.getByText(/2\.0s/)).toBeInTheDocument();
    expect(screen.getByText(/500/)).toBeInTheDocument();
    expect(screen.getByText(/1000/)).toBeInTheDocument();
  });
});
