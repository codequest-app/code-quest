import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useChatStore } from '../../../stores/chatStore.ts';
import { useOrchestratorStore } from '../../../stores/orchestratorStore.ts';
import { OrchestratorPage } from '../OrchestratorPage.tsx';

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

describe('OrchestratorPage', () => {
  beforeEach(() => {
    useOrchestratorStore.getState().orchestrators.clear();
    useChatStore.getState().chatSessions.clear();
  });

  it('should show "not found" when orchestrator does not exist', () => {
    render(<OrchestratorPage {...defaultProps} />);
    expect(screen.getByText('Orchestrator not found')).toBeInTheDocument();
  });

  it('should show PlanningView when status is idle', () => {
    useChatStore.getState().initChatSession('coord-1', 'claude');
    useOrchestratorStore.getState().initOrchestrator('orch-1', 'coord-1', 'claude');

    render(<OrchestratorPage {...defaultProps} />);
    expect(screen.getByTestId('planning-view')).toBeInTheDocument();
  });

  it('should show dispatching overlay when status is dispatching', () => {
    useChatStore.getState().initChatSession('coord-1', 'claude');
    useOrchestratorStore.getState().initOrchestrator('orch-1', 'coord-1', 'claude');
    useOrchestratorStore.getState().setStatus('orch-1', 'dispatching');

    render(<OrchestratorPage {...defaultProps} />);
    expect(screen.getByTestId('dispatching-overlay')).toBeInTheDocument();
  });

  it('should show worker grid when status is workers-running', () => {
    useChatStore.getState().initChatSession('coord-1', 'claude');
    useOrchestratorStore.getState().initOrchestrator('orch-1', 'coord-1', 'claude');
    useOrchestratorStore.getState().setStatus('orch-1', 'workers-running');
    useOrchestratorStore
      .getState()
      .setWorkers('orch-1', [
        { id: 'w1', task: { description: 'Test', provider: 'claude' }, status: 'running' },
      ]);

    render(<OrchestratorPage {...defaultProps} />);
    expect(screen.getByTestId('worker-grid')).toBeInTheDocument();
  });

  it('should show worker grid when status is workers-complete', () => {
    useChatStore.getState().initChatSession('coord-1', 'claude');
    useOrchestratorStore.getState().initOrchestrator('orch-1', 'coord-1', 'claude');
    useOrchestratorStore.getState().setStatus('orch-1', 'workers-complete');
    useOrchestratorStore
      .getState()
      .setWorkers('orch-1', [
        { id: 'w1', task: { description: 'Test', provider: 'claude' }, status: 'complete' },
      ]);

    render(<OrchestratorPage {...defaultProps} />);
    expect(screen.getByTestId('worker-grid')).toBeInTheDocument();
  });

  it('should show worker grid when status is workers-paused', () => {
    useChatStore.getState().initChatSession('coord-1', 'claude');
    useOrchestratorStore.getState().initOrchestrator('orch-1', 'coord-1', 'claude');
    useOrchestratorStore.getState().setStatus('orch-1', 'workers-paused');
    useOrchestratorStore.getState().setWorkers('orch-1', [
      {
        id: 'w1',
        task: { description: 'Test', provider: 'claude' },
        status: 'error',
        error: 'fail',
      },
    ]);

    render(<OrchestratorPage {...defaultProps} />);
    expect(screen.getByTestId('worker-grid')).toBeInTheDocument();
  });

  it('should show synthesis view when status is synthesizing', () => {
    useChatStore.getState().initChatSession('coord-1', 'claude');
    useOrchestratorStore.getState().initOrchestrator('orch-1', 'coord-1', 'claude');
    useOrchestratorStore.getState().setStatus('orch-1', 'synthesizing');

    render(<OrchestratorPage {...defaultProps} />);
    expect(screen.getByTestId('synthesis-view')).toBeInTheDocument();
  });

  it('should show synthesis view when status is complete', () => {
    useChatStore.getState().initChatSession('coord-1', 'claude');
    useOrchestratorStore.getState().initOrchestrator('orch-1', 'coord-1', 'claude');
    useOrchestratorStore.getState().setStatus('orch-1', 'complete');

    render(<OrchestratorPage {...defaultProps} />);
    expect(screen.getByTestId('synthesis-view')).toBeInTheDocument();
  });

  it('should show error view when status is error', () => {
    useChatStore.getState().initChatSession('coord-1', 'claude');
    useOrchestratorStore.getState().initOrchestrator('orch-1', 'coord-1', 'claude');
    useOrchestratorStore.getState().setStatus('orch-1', 'error');

    render(<OrchestratorPage {...defaultProps} />);
    expect(screen.getByTestId('error-view')).toBeInTheDocument();
  });

  it('should render PhaseHeader with correct status', () => {
    useChatStore.getState().initChatSession('coord-1', 'claude');
    useOrchestratorStore.getState().initOrchestrator('orch-1', 'coord-1', 'claude');

    render(<OrchestratorPage {...defaultProps} />);
    expect(screen.getByTestId('phase-header')).toBeInTheDocument();
  });
});
