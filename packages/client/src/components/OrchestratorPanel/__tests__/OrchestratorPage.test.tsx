import type { OrchestratorStatus } from '@code-quest/shared';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useOrchestratorStore } from '../../../stores/orchestratorStore.ts';
import { OrchestratorPage } from '../OrchestratorPage.tsx';

vi.mock('../PhaseHeader.tsx', () => ({
  PhaseHeader: (props: { status: string }) => (
    <div data-testid="phase-header" data-status={props.status} />
  ),
}));

vi.mock('../PlanningView.tsx', () => ({
  PlanningView: () => <div data-testid="planning-view" />,
}));

vi.mock('../WorkerGrid.tsx', () => ({
  WorkerGrid: (props: {
    status: string;
    onRetryWorker?: (id: string) => void;
    onSkipWorker?: (id: string) => void;
    onSynthesize?: () => void;
  }) => (
    <div
      data-testid="worker-grid"
      data-status={props.status}
      data-has-retry={String(!!props.onRetryWorker)}
      data-has-skip={String(!!props.onSkipWorker)}
      data-has-synthesize={String(!!props.onSynthesize)}
    />
  ),
}));

vi.mock('../SynthesisView.tsx', () => ({
  SynthesisView: () => <div data-testid="synthesis-view" />,
}));

vi.mock('../ErrorView.tsx', () => ({
  ErrorView: () => <div data-testid="error-view" />,
}));

const defaultProps = {
  orchestratorId: 'orch-1',
  onSendCoordinator: vi.fn(),
  onAbortCoordinator: vi.fn(),
  onDispatch: vi.fn(),
  onSynthesize: vi.fn(),
  onAbort: vi.fn(),
  onRetryWorker: vi.fn(),
  onSkipWorker: vi.fn(),
};

function initOrch(status?: OrchestratorStatus) {
  useOrchestratorStore.getState().initOrchestrator('orch-1', 'coord-1', 'claude');
  if (status) {
    useOrchestratorStore.getState().setStatus('orch-1', status);
  }
}

function setWorkers(status: 'running' | 'complete' | 'error', error?: string) {
  useOrchestratorStore
    .getState()
    .setWorkers('orch-1', [
      { id: 'w1', task: { description: 'Test', provider: 'claude' }, status, error },
    ]);
}

describe('OrchestratorPage', () => {
  beforeEach(() => {
    useOrchestratorStore.getState().orchestrators.clear();
  });

  it('should show "not found" when orchestrator does not exist', () => {
    render(<OrchestratorPage {...defaultProps} />);
    expect(screen.getByText('Orchestrator not found')).toBeInTheDocument();
  });

  it('should show PlanningView when status is idle', () => {
    initOrch();
    render(<OrchestratorPage {...defaultProps} />);
    expect(screen.getByTestId('planning-view')).toBeInTheDocument();
  });

  it('should show dispatching overlay when status is dispatching', () => {
    initOrch('dispatching');
    render(<OrchestratorPage {...defaultProps} />);
    expect(screen.getByTestId('dispatching-overlay')).toBeInTheDocument();
  });

  it('should show worker grid when status is workers-running', () => {
    initOrch('workers-running');
    setWorkers('running');
    render(<OrchestratorPage {...defaultProps} />);
    expect(screen.getByTestId('worker-grid')).toBeInTheDocument();
  });

  it('should show worker grid when status is workers-complete', () => {
    initOrch('workers-complete');
    setWorkers('complete');
    render(<OrchestratorPage {...defaultProps} />);
    expect(screen.getByTestId('worker-grid')).toBeInTheDocument();
  });

  it('should show worker grid when status is workers-paused', () => {
    initOrch('workers-paused');
    setWorkers('error', 'fail');
    render(<OrchestratorPage {...defaultProps} />);
    expect(screen.getByTestId('worker-grid')).toBeInTheDocument();
  });

  it('should show worker grid when status is merging', () => {
    initOrch('merging');
    setWorkers('complete');
    render(<OrchestratorPage {...defaultProps} />);
    expect(screen.getByTestId('worker-grid')).toBeInTheDocument();
  });

  it('should pass retry/skip/synthesize callbacks to WorkerGrid', () => {
    initOrch('workers-paused');
    setWorkers('error', 'fail');
    render(<OrchestratorPage {...defaultProps} />);

    const grid = screen.getByTestId('worker-grid');
    expect(grid).toHaveAttribute('data-has-retry', 'true');
    expect(grid).toHaveAttribute('data-has-skip', 'true');
    expect(grid).toHaveAttribute('data-has-synthesize', 'true');
  });

  it('should show synthesis view when status is synthesizing', () => {
    initOrch('synthesizing');
    render(<OrchestratorPage {...defaultProps} />);
    expect(screen.getByTestId('synthesis-view')).toBeInTheDocument();
  });

  it('should show synthesis view when status is complete', () => {
    initOrch('complete');
    render(<OrchestratorPage {...defaultProps} />);
    expect(screen.getByTestId('synthesis-view')).toBeInTheDocument();
  });

  it('should show error view when status is error', () => {
    initOrch('error');
    render(<OrchestratorPage {...defaultProps} />);
    expect(screen.getByTestId('error-view')).toBeInTheDocument();
  });

  it('should render PhaseHeader with correct status', () => {
    initOrch();
    render(<OrchestratorPage {...defaultProps} />);
    expect(screen.getByTestId('phase-header')).toBeInTheDocument();
  });
});
