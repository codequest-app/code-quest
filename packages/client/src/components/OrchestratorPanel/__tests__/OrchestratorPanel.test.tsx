import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OrchestratorPanel } from '../OrchestratorPanel';
import { useOrchestratorStore } from '../../../stores/orchestratorStore';
import { useChatStore } from '../../../stores/chatStore';

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
      />
    );
  }

  it('should render coordinator chat panel', () => {
    useChatStore.getState().initChatSession('coord-1', 'claude');
    useOrchestratorStore.getState().initOrchestrator('orch-1', 'coord-1', 'claude');

    renderPanel();

    expect(screen.getByTestId('orchestrator-panel')).toBeInTheDocument();
    expect(screen.getByTestId('chat-panel')).toBeInTheDocument();
  });

  it('should show dispatch form with add task button', () => {
    useChatStore.getState().initChatSession('coord-1', 'claude');
    useOrchestratorStore.getState().initOrchestrator('orch-1', 'coord-1', 'claude');

    renderPanel();

    expect(screen.getByTestId('dispatch-form')).toBeInTheDocument();
    expect(screen.getByLabelText('Add task')).toBeInTheDocument();
    expect(screen.getByLabelText('Dispatch all')).toBeInTheDocument();
  });

  it('should dispatch sub-tasks on form submit', () => {
    useChatStore.getState().initChatSession('coord-1', 'claude');
    useOrchestratorStore.getState().initOrchestrator('orch-1', 'coord-1', 'claude');

    renderPanel();

    const input = screen.getByLabelText('Task 1 description');
    fireEvent.change(input, { target: { value: 'Write tests' } });
    fireEvent.click(screen.getByLabelText('Dispatch all'));

    expect(mockOnDispatch).toHaveBeenCalledWith('orch-1', [
      { description: 'Write tests', provider: 'claude' },
    ]);
  });

  it('should add and dispatch multiple tasks', () => {
    useChatStore.getState().initChatSession('coord-1', 'claude');
    useOrchestratorStore.getState().initOrchestrator('orch-1', 'coord-1', 'claude');

    renderPanel();

    // Add second task
    fireEvent.click(screen.getByLabelText('Add task'));

    const input1 = screen.getByLabelText('Task 1 description');
    const input2 = screen.getByLabelText('Task 2 description');
    fireEvent.change(input1, { target: { value: 'Write tests' } });
    fireEvent.change(input2, { target: { value: 'Write docs' } });

    fireEvent.click(screen.getByLabelText('Dispatch all'));

    expect(mockOnDispatch).toHaveBeenCalledWith('orch-1', [
      { description: 'Write tests', provider: 'claude' },
      { description: 'Write docs', provider: 'claude' },
    ]);
  });

  it('should show worker cards with status indicators', () => {
    useChatStore.getState().initChatSession('coord-1', 'claude');
    useOrchestratorStore.getState().initOrchestrator('orch-1', 'coord-1', 'claude');
    useOrchestratorStore.getState().setWorkers('orch-1', [
      { id: 'w1', task: { description: 'Write tests', provider: 'claude' }, status: 'running', result: 'Working...' },
      { id: 'w2', task: { description: 'Write docs', provider: 'gemini' }, status: 'complete', result: 'Done!' },
    ]);
    useOrchestratorStore.getState().setStatus('orch-1', 'workers-running');

    renderPanel();

    const cards = screen.getAllByTestId('worker-card');
    expect(cards).toHaveLength(2);
    expect(screen.getByText('Write tests')).toBeInTheDocument();
    expect(screen.getByText('Write docs')).toBeInTheDocument();
  });

  it('should show worker progress (streaming text preview)', () => {
    useChatStore.getState().initChatSession('coord-1', 'claude');
    useOrchestratorStore.getState().initOrchestrator('orch-1', 'coord-1', 'claude');
    useOrchestratorStore.getState().setWorkers('orch-1', [
      { id: 'w1', task: { description: 'task1', provider: 'claude' }, status: 'running', result: 'Partial output...' },
    ]);
    useOrchestratorStore.getState().setStatus('orch-1', 'workers-running');

    renderPanel();

    expect(screen.getByTestId('worker-preview')).toBeInTheDocument();
    expect(screen.getByText('Partial output...')).toBeInTheDocument();
  });

  it('should show synthesize button when all workers complete', () => {
    useChatStore.getState().initChatSession('coord-1', 'claude');
    useOrchestratorStore.getState().initOrchestrator('orch-1', 'coord-1', 'claude');
    useOrchestratorStore.getState().setAllComplete('orch-1', [
      { id: 'w1', task: { description: 'task1', provider: 'claude' }, status: 'complete', result: 'Done' },
    ]);

    renderPanel();

    const synthesizeBtn = screen.getByLabelText('Synthesize');
    expect(synthesizeBtn).toBeInTheDocument();

    fireEvent.click(synthesizeBtn);
    expect(mockOnSynthesize).toHaveBeenCalledWith('orch-1');
  });

  it('should show aggregated stats', () => {
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
    expect(screen.getByText(/\$0\.0150/)).toBeInTheDocument();
  });

  it('should allow abort during execution', () => {
    useChatStore.getState().initChatSession('coord-1', 'claude');
    useOrchestratorStore.getState().initOrchestrator('orch-1', 'coord-1', 'claude');
    useOrchestratorStore.getState().setStatus('orch-1', 'workers-running');

    renderPanel();

    const abortBtn = screen.getByLabelText('Abort');
    expect(abortBtn).toBeInTheDocument();

    fireEvent.click(abortBtn);
    expect(mockOnAbort).toHaveBeenCalledWith('orch-1');
  });

  it('should show not found when orchestrator does not exist', () => {
    renderPanel('non-existent');

    expect(screen.getByText('Orchestrator not found')).toBeInTheDocument();
  });
});
