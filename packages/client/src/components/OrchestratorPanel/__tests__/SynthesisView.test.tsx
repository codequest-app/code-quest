import type { WorkerInfo } from '@code-quest/shared';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SynthesisView } from '../SynthesisView.tsx';

// react-resizable-panels throws layout errors in jsdom — suppress them
let originalOnError: typeof window.onerror;
beforeEach(() => {
  originalOnError = window.onerror;
  window.onerror = () => true;
});
afterEach(() => {
  window.onerror = originalOnError;
});

vi.mock('../CoordinatorPanel.tsx', () => ({
  CoordinatorPanel: (props: { coordinatorId: string }) => (
    <div data-testid="coordinator-panel" data-coordinator-id={props.coordinatorId} />
  ),
}));

vi.mock('../WorkerSummaryPanel.tsx', () => ({
  WorkerSummaryPanel: (props: { workers: WorkerInfo[] }) => (
    <div data-testid="worker-summary-panel" data-worker-count={props.workers.length}>
      {props.workers.map((w) => (
        <div key={w.id} data-testid={`summary-${w.id}`}>
          <span>{w.task.description}</span>
          <span>{w.status}</span>
          {w.stats?.costUsd != null && <span>${w.stats.costUsd.toFixed(2)}</span>}
          {w.stats?.durationMs != null && <span>{(w.stats.durationMs / 1000).toFixed(1)}s</span>}
          {w.error && <span>{w.error}</span>}
        </div>
      ))}
    </div>
  ),
}));

function makeWorker(overrides: Partial<WorkerInfo> & { id: string }): WorkerInfo {
  return {
    task: { description: 'Test task', provider: 'claude' },
    status: 'complete',
    ...overrides,
  };
}

describe('SynthesisView', () => {
  it('should render coordinator panel with correct id', () => {
    render(
      <SynthesisView
        coordinatorId="coord-1"
        workers={[makeWorker({ id: 'w1' })]}
        status="synthesizing"
        onSendCoordinator={vi.fn()}
        onAbortCoordinator={vi.fn()}
      />,
    );

    const panel = screen.getByTestId('coordinator-panel');
    expect(panel).toBeInTheDocument();
    expect(panel).toHaveAttribute('data-coordinator-id', 'coord-1');
  });

  it('should render worker summary panel with workers', () => {
    render(
      <SynthesisView
        coordinatorId="coord-1"
        workers={[
          makeWorker({ id: 'w1', task: { description: 'Write tests', provider: 'claude' } }),
          makeWorker({ id: 'w2', task: { description: 'Write docs', provider: 'gemini' } }),
        ]}
        status="synthesizing"
        onSendCoordinator={vi.fn()}
        onAbortCoordinator={vi.fn()}
      />,
    );

    expect(screen.getByTestId('worker-summary-panel')).toBeInTheDocument();
    expect(screen.getByText(/Write tests/)).toBeInTheDocument();
    expect(screen.getByText(/Write docs/)).toBeInTheDocument();
  });

  it('should show worker stats in summary cards', () => {
    render(
      <SynthesisView
        coordinatorId="coord-1"
        workers={[
          makeWorker({
            id: 'w1',
            status: 'complete',
            stats: { costUsd: 0.02, durationMs: 12000 },
          }),
        ]}
        status="complete"
        onSendCoordinator={vi.fn()}
        onAbortCoordinator={vi.fn()}
      />,
    );

    expect(screen.getByText(/\$0\.02/)).toBeInTheDocument();
    expect(screen.getByText(/12\.0s/)).toBeInTheDocument();
  });

  it('should show error status on errored worker summary card', () => {
    render(
      <SynthesisView
        coordinatorId="coord-1"
        workers={[makeWorker({ id: 'w1', status: 'error', error: 'Rate limit' })]}
        status="complete"
        onSendCoordinator={vi.fn()}
        onAbortCoordinator={vi.fn()}
      />,
    );

    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });
});
