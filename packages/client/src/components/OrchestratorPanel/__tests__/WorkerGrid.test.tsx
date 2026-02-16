import type { WorkerInfo } from '@code-quest/shared';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkerGrid } from '../WorkerGrid.tsx';

// react-resizable-panels throws layout errors in jsdom — suppress them
let originalOnError: typeof window.onerror;
beforeEach(() => {
  originalOnError = window.onerror;
  window.onerror = () => true;
});
afterEach(() => {
  window.onerror = originalOnError;
});

vi.mock('../WorkerPane.tsx', () => ({
  WorkerPane: (props: {
    index: number;
    worker: WorkerInfo;
    isPaused?: boolean;
    onRetryWorker?: (id: string) => void;
    onSkipWorker?: (id: string) => void;
  }) => (
    <div
      data-testid={`worker-pane-${props.worker.id}`}
      data-index={props.index}
      data-status={props.worker.status}
      data-is-paused={String(!!props.isPaused)}
      data-has-retry={String(!!props.onRetryWorker)}
      data-has-skip={String(!!props.onSkipWorker)}
    >
      <span>{props.worker.task.description}</span>
      {props.worker.result && <span>{props.worker.result}</span>}
      {props.worker.error && <span>{props.worker.error}</span>}
      {props.worker.stats?.costUsd != null && <span>${props.worker.stats.costUsd.toFixed(2)}</span>}
      {props.worker.stats?.durationMs != null && (
        <span>{(props.worker.stats.durationMs / 1000).toFixed(1)}s</span>
      )}
      {props.isPaused && props.worker.status === 'error' && props.onRetryWorker && (
        <button
          type="button"
          aria-label={`Retry worker ${props.index + 1}`}
          onClick={() => props.onRetryWorker?.(props.worker.id)}
        >
          Retry
        </button>
      )}
      {props.isPaused && props.worker.status === 'error' && props.onSkipWorker && (
        <button
          type="button"
          aria-label={`Skip worker ${props.index + 1}`}
          onClick={() => props.onSkipWorker?.(props.worker.id)}
        >
          Skip
        </button>
      )}
    </div>
  ),
}));

function makeWorker(overrides: Partial<WorkerInfo> & { id: string }): WorkerInfo {
  return {
    task: { description: 'Test task', provider: 'claude' },
    status: 'running',
    ...overrides,
  };
}

describe('WorkerGrid', () => {
  it('should render worker panes for each worker', () => {
    const workers = [
      makeWorker({ id: 'w1' }),
      makeWorker({ id: 'w2', task: { description: 'Second', provider: 'gemini' } }),
    ];
    render(<WorkerGrid workers={workers} status="workers-running" onSynthesize={vi.fn()} />);

    expect(screen.getByText(/Test task/)).toBeInTheDocument();
    expect(screen.getByText(/Second/)).toBeInTheDocument();
  });

  it('should show worker status icons', () => {
    const workers = [
      makeWorker({ id: 'w1', status: 'complete' }),
      makeWorker({ id: 'w2', status: 'running' }),
      makeWorker({ id: 'w3', status: 'error', error: 'Failed' }),
    ];
    render(<WorkerGrid workers={workers} status="workers-running" onSynthesize={vi.fn()} />);

    expect(screen.getByTestId('worker-pane-w1')).toBeInTheDocument();
    expect(screen.getByTestId('worker-pane-w2')).toBeInTheDocument();
    expect(screen.getByTestId('worker-pane-w3')).toBeInTheDocument();
  });

  it('should display streaming text in worker pane', () => {
    const workers = [makeWorker({ id: 'w1', result: 'Hello world streaming output' })];
    render(<WorkerGrid workers={workers} status="workers-running" onSynthesize={vi.fn()} />);

    expect(screen.getByText(/Hello world streaming output/)).toBeInTheDocument();
  });

  it('should show synthesize button when workers-complete', () => {
    const workers = [makeWorker({ id: 'w1', status: 'complete' })];
    render(<WorkerGrid workers={workers} status="workers-complete" onSynthesize={vi.fn()} />);

    expect(screen.getByRole('button', { name: /synthesize/i })).toBeInTheDocument();
  });

  it('should not show synthesize button when workers-running', () => {
    const workers = [makeWorker({ id: 'w1', status: 'running' })];
    render(<WorkerGrid workers={workers} status="workers-running" onSynthesize={vi.fn()} />);

    expect(screen.queryByRole('button', { name: /synthesize/i })).not.toBeInTheDocument();
  });

  it('should call onSynthesize when synthesize button clicked', () => {
    const onSynthesize = vi.fn();
    const workers = [makeWorker({ id: 'w1', status: 'complete' })];
    render(<WorkerGrid workers={workers} status="workers-complete" onSynthesize={onSynthesize} />);

    fireEvent.click(screen.getByRole('button', { name: /synthesize/i }));
    expect(onSynthesize).toHaveBeenCalledTimes(1);
  });

  it('should show worker stats when complete', () => {
    const workers = [
      makeWorker({
        id: 'w1',
        status: 'complete',
        stats: { costUsd: 0.02, durationMs: 12000, inputTokens: 100, outputTokens: 200 },
      }),
    ];
    render(<WorkerGrid workers={workers} status="workers-complete" onSynthesize={vi.fn()} />);

    expect(screen.getByText(/\$0\.02/)).toBeInTheDocument();
    expect(screen.getByText(/12\.0s/)).toBeInTheDocument();
  });

  it('should show error text for errored worker', () => {
    const workers = [makeWorker({ id: 'w1', status: 'error', error: 'Rate limit exceeded' })];
    render(<WorkerGrid workers={workers} status="workers-running" onSynthesize={vi.fn()} />);

    expect(screen.getByText(/Rate limit exceeded/)).toBeInTheDocument();
  });

  describe('workers-paused state', () => {
    it('should show "Synthesize Anyway" button when paused', () => {
      const workers = [
        makeWorker({ id: 'w1', status: 'complete' }),
        makeWorker({ id: 'w2', status: 'error', error: 'Failed' }),
      ];
      render(<WorkerGrid workers={workers} status="workers-paused" onSynthesize={vi.fn()} />);

      expect(screen.getByRole('button', { name: /synthesize/i })).toHaveTextContent(
        'Synthesize Anyway',
      );
    });

    it('should show paused hint with error count', () => {
      const workers = [
        makeWorker({ id: 'w1', status: 'complete' }),
        makeWorker({ id: 'w2', status: 'error', error: 'Failed' }),
      ];
      render(<WorkerGrid workers={workers} status="workers-paused" onSynthesize={vi.fn()} />);

      expect(screen.getByText(/1 failed, awaiting action/)).toBeInTheDocument();
    });

    it('should pass isPaused to worker panes when paused', () => {
      const workers = [makeWorker({ id: 'w1', status: 'error', error: 'Failed' })];
      render(
        <WorkerGrid
          workers={workers}
          status="workers-paused"
          onSynthesize={vi.fn()}
          onRetryWorker={vi.fn()}
          onSkipWorker={vi.fn()}
        />,
      );

      expect(screen.getByTestId('worker-pane-w1')).toHaveAttribute('data-is-paused', 'true');
    });

    it('should show retry and skip buttons on error workers when paused', () => {
      const workers = [makeWorker({ id: 'w1', status: 'error', error: 'Failed' })];
      render(
        <WorkerGrid
          workers={workers}
          status="workers-paused"
          onSynthesize={vi.fn()}
          onRetryWorker={vi.fn()}
          onSkipWorker={vi.fn()}
        />,
      );

      expect(screen.getByRole('button', { name: /retry worker 1/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /skip worker 1/i })).toBeInTheDocument();
    });

    it('should not show retry/skip on complete workers when paused', () => {
      const workers = [makeWorker({ id: 'w1', status: 'complete' })];
      render(
        <WorkerGrid
          workers={workers}
          status="workers-paused"
          onSynthesize={vi.fn()}
          onRetryWorker={vi.fn()}
          onSkipWorker={vi.fn()}
        />,
      );

      expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /skip/i })).not.toBeInTheDocument();
    });

    it('should call onRetryWorker with worker id when retry clicked', () => {
      const onRetryWorker = vi.fn();
      const workers = [makeWorker({ id: 'w1', status: 'error', error: 'Failed' })];
      render(
        <WorkerGrid
          workers={workers}
          status="workers-paused"
          onSynthesize={vi.fn()}
          onRetryWorker={onRetryWorker}
          onSkipWorker={vi.fn()}
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: /retry worker 1/i }));
      expect(onRetryWorker).toHaveBeenCalledWith('w1');
    });

    it('should call onSkipWorker with worker id when skip clicked', () => {
      const onSkipWorker = vi.fn();
      const workers = [makeWorker({ id: 'w1', status: 'error', error: 'Failed' })];
      render(
        <WorkerGrid
          workers={workers}
          status="workers-paused"
          onSynthesize={vi.fn()}
          onRetryWorker={vi.fn()}
          onSkipWorker={onSkipWorker}
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: /skip worker 1/i }));
      expect(onSkipWorker).toHaveBeenCalledWith('w1');
    });
  });
});
