import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useChatStore } from '../../../stores/chatStore';
import { useOrchestratorStore } from '../../../stores/orchestratorStore';
import { OrchestratorPanel } from '../OrchestratorPanel';

describe('OrchestratorPanel', () => {
  const mockOnSendCoordinator = vi.fn();
  const mockOnAbortCoordinator = vi.fn();
  const mockOnDispatch = vi.fn();
  const mockOnSynthesize = vi.fn();
  const mockOnAbort = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useOrchestratorStore.setState({ orchestrators: new Map() });
    useChatStore.setState({ chatSessions: new Map() });
  });

  function renderPanel(orchId = 'orch-1') {
    return render(
      <OrchestratorPanel
        orchestratorId={orchId}
        onSendCoordinator={mockOnSendCoordinator}
        onAbortCoordinator={mockOnAbortCoordinator}
        onDispatch={mockOnDispatch}
        onSynthesize={mockOnSynthesize}
        onAbort={mockOnAbort}
      />,
    );
  }

  it('should render orchestrator panel with child components', () => {
    useChatStore.getState().initChatSession('coord-1', 'claude');
    useOrchestratorStore.getState().initOrchestrator('orch-1', 'coord-1', 'claude');

    renderPanel();

    expect(screen.getByTestId('orchestrator-panel')).toBeInTheDocument();
    expect(screen.getByTestId('chat-panel')).toBeInTheDocument();
    expect(screen.getByTestId('dispatch-form')).toBeInTheDocument();
  });

  it('should show "Orchestrator not found" for invalid id', () => {
    renderPanel('non-existent');

    expect(screen.getByText('Orchestrator not found')).toBeInTheDocument();
  });

  it('should delegate dispatch to parent with orchestratorId', () => {
    useChatStore.getState().initChatSession('coord-1', 'claude');
    useOrchestratorStore.getState().initOrchestrator('orch-1', 'coord-1', 'claude');

    renderPanel();

    fireEvent.change(screen.getByLabelText('Task 1 description'), {
      target: { value: 'Write tests' },
    });
    fireEvent.click(screen.getByLabelText('Dispatch all'));

    expect(mockOnDispatch).toHaveBeenCalledWith('orch-1', [
      { description: 'Write tests', provider: 'claude' },
    ]);
  });

  it('should delegate synthesize to parent', () => {
    useChatStore.getState().initChatSession('coord-1', 'claude');
    useOrchestratorStore.getState().initOrchestrator('orch-1', 'coord-1', 'claude');
    useOrchestratorStore.getState().setAllComplete('orch-1', [
      {
        id: 'w1',
        task: { description: 'task1', provider: 'claude' },
        status: 'complete',
        result: 'Done',
      },
    ]);

    renderPanel();

    fireEvent.click(screen.getByLabelText('Synthesize'));
    expect(mockOnSynthesize).toHaveBeenCalledWith('orch-1');
  });

  it('should delegate abort to parent', () => {
    useChatStore.getState().initChatSession('coord-1', 'claude');
    useOrchestratorStore.getState().initOrchestrator('orch-1', 'coord-1', 'claude');
    useOrchestratorStore.getState().setStatus('orch-1', 'workers-running');

    renderPanel();

    fireEvent.click(screen.getByLabelText('Abort'));
    expect(mockOnAbort).toHaveBeenCalledWith('orch-1');
  });

  it('should render worker panel when workers exist', () => {
    useChatStore.getState().initChatSession('coord-1', 'claude');
    useOrchestratorStore.getState().initOrchestrator('orch-1', 'coord-1', 'claude');
    useOrchestratorStore
      .getState()
      .setWorkers('orch-1', [
        { id: 'w1', task: { description: 'task1', provider: 'claude' }, status: 'running' },
      ]);
    useOrchestratorStore.getState().setStatus('orch-1', 'workers-running');

    renderPanel();

    expect(screen.getByTestId('worker-panel')).toBeInTheDocument();
    expect(screen.getByTestId('worker-card')).toBeInTheDocument();
  });

  it('should show aggregated stats when present', () => {
    useChatStore.getState().initChatSession('coord-1', 'claude');
    useOrchestratorStore.getState().initOrchestrator('orch-1', 'coord-1', 'claude');
    useOrchestratorStore.getState().setAggregatedStats('orch-1', {
      costUsd: 0.015,
      durationMs: 3200,
      inputTokens: 450,
      outputTokens: 230,
    });

    renderPanel();

    expect(screen.getByTestId('orchestrator-stats')).toBeInTheDocument();
    expect(screen.getByTestId('stats-bar')).toBeInTheDocument();
  });
});
