import type { WorkerInfo } from '@code-quest/shared';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ErrorView } from '../ErrorView.tsx';

function makeWorker(overrides: Partial<WorkerInfo> & { id: string }): WorkerInfo {
  return {
    task: { description: 'Test task', provider: 'claude' },
    status: 'complete',
    ...overrides,
  };
}

describe('ErrorView', () => {
  it('should render error view container', () => {
    render(<ErrorView workers={[]} onRetry={vi.fn()} />);

    expect(screen.getByTestId('error-view')).toBeInTheDocument();
  });

  it('should show generic error message', () => {
    render(<ErrorView workers={[]} onRetry={vi.fn()} />);

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it('should show worker errors', () => {
    render(
      <ErrorView
        workers={[
          makeWorker({ id: 'w1', status: 'error', error: 'Rate limit exceeded' }),
          makeWorker({ id: 'w2', status: 'complete' }),
          makeWorker({ id: 'w3', status: 'error', error: 'Connection timeout' }),
        ]}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByText(/Rate limit exceeded/)).toBeInTheDocument();
    expect(screen.getByText(/Connection timeout/)).toBeInTheDocument();
  });

  it('should show retry button and call onRetry', () => {
    const onRetry = vi.fn();

    render(
      <ErrorView
        workers={[makeWorker({ id: 'w1', status: 'error', error: 'Fail' })]}
        onRetry={onRetry}
      />,
    );

    const retryButton = screen.getByRole('button', { name: /retry/i });
    retryButton.click();

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should only list workers with error status', () => {
    render(
      <ErrorView
        workers={[
          makeWorker({ id: 'w1', status: 'error', error: 'Failed' }),
          makeWorker({ id: 'w2', status: 'complete' }),
        ]}
        onRetry={vi.fn()}
      />,
    );

    const errorItems = screen.getAllByTestId('error-worker-item');
    expect(errorItems).toHaveLength(1);
  });
});
