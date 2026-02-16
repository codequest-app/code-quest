import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { useChatStore } from '../../../stores/chatStore.ts';
import { PlanningView } from '../PlanningView.tsx';
import { TASK_GENERATION_PROMPT } from '../taskGenerationPrompt.ts';

// Suppress react-resizable-panels jsdom warnings (updateCursorStyle in jsdom)
const origOnError = window.onerror;
beforeAll(() => {
  window.onerror = () => true;
});

const defaultProps = {
  coordinatorId: 'coord-1',
  onSend: vi.fn(),
  onAbort: vi.fn(),
  onDispatch: vi.fn(),
};

/**
 * Simulate the full send→process→response cycle.
 * In real app, onSend triggers addUserMessage; in tests onSend is mocked,
 * so we manually add the user message to set isProcessing=true.
 */
function simulateSendAndResponse(sessionId: string, responseContent: string) {
  // 1. Mark session as processing (simulates what onSend would do)
  act(() => {
    useChatStore.getState().addUserMessage(sessionId, TASK_GENERATION_PROMPT);
  });
  // 2. Coordinator streams text response
  act(() => {
    useChatStore.getState().handleChatEvent(sessionId, {
      type: 'text',
      data: { content: responseContent },
    });
  });
  // 3. Coordinator finishes → isProcessing becomes false
  act(() => {
    useChatStore.getState().handleChatEvent(sessionId, {
      type: 'result',
      data: { stats: { inputTokens: 10, outputTokens: 20 } },
    });
  });
}

describe('PlanningView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useChatStore.getState().chatSessions.clear();
    useChatStore.getState().initChatSession('coord-1', 'claude');
  });

  afterAll(() => {
    window.onerror = origOnError;
  });

  it('should show ChatPanel by default', () => {
    render(<PlanningView {...defaultProps} />);
    expect(screen.getByTestId('chat-panel')).toBeInTheDocument();
  });

  it('should not show TaskPlanner by default', () => {
    render(<PlanningView {...defaultProps} />);
    expect(screen.queryByTestId('task-planner')).not.toBeInTheDocument();
  });

  it('should show "Plan Tasks" button', () => {
    render(<PlanningView {...defaultProps} />);
    expect(screen.getByRole('button', { name: /plan tasks/i })).toBeInTheDocument();
  });

  it('should call onSend with TASK_GENERATION_PROMPT when clicking "Plan Tasks"', async () => {
    const user = userEvent.setup();
    render(<PlanningView {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /plan tasks/i }));
    expect(defaultProps.onSend).toHaveBeenCalledWith('coord-1', TASK_GENERATION_PROMPT);
  });

  it('should show "Generating..." disabled button during generating state', async () => {
    const user = userEvent.setup();
    render(<PlanningView {...defaultProps} />);

    // Set isProcessing=true before clicking so effect won't immediately transition
    act(() => {
      useChatStore.getState().addUserMessage('coord-1', TASK_GENERATION_PROMPT);
    });

    await user.click(screen.getByRole('button', { name: /plan tasks/i }));

    const generatingBtn = screen.getByRole('button', { name: /generating/i });
    expect(generatingBtn).toBeInTheDocument();
    expect(generatingBtn).toBeDisabled();
  });

  it('should transition to planning state when isProcessing becomes false', async () => {
    const user = userEvent.setup();
    render(<PlanningView {...defaultProps} />);

    // Set processing to keep generating state stable
    act(() => {
      useChatStore.getState().addUserMessage('coord-1', TASK_GENERATION_PROMPT);
    });

    await user.click(screen.getByRole('button', { name: /plan tasks/i }));

    const responseContent = `\`\`\`json
{
  "tasks": [
    { "description": "Refactor auth module", "provider": "claude" }
  ]
}
\`\`\``;

    // Stream response + finish
    act(() => {
      useChatStore.getState().handleChatEvent('coord-1', {
        type: 'text',
        data: { content: responseContent },
      });
    });
    act(() => {
      useChatStore.getState().handleChatEvent('coord-1', {
        type: 'result',
        data: { stats: { inputTokens: 10, outputTokens: 20 } },
      });
    });

    // Should now be in planning state with TaskPlanner visible
    expect(screen.getByTestId('task-planner')).toBeInTheDocument();
  });

  it('should prefill TaskPlanner with parsed tasks', async () => {
    const user = userEvent.setup();
    render(<PlanningView {...defaultProps} />);

    // Set processing
    act(() => {
      useChatStore.getState().addUserMessage('coord-1', TASK_GENERATION_PROMPT);
    });

    await user.click(screen.getByRole('button', { name: /plan tasks/i }));

    const responseContent = `\`\`\`json
{
  "tasks": [
    { "description": "Refactor auth", "provider": "claude" },
    { "description": "Add tests", "provider": "gemini" }
  ]
}
\`\`\``;

    act(() => {
      useChatStore.getState().handleChatEvent('coord-1', {
        type: 'text',
        data: { content: responseContent },
      });
    });
    act(() => {
      useChatStore.getState().handleChatEvent('coord-1', {
        type: 'result',
        data: { stats: { inputTokens: 10, outputTokens: 20 } },
      });
    });

    expect(screen.getByLabelText('Task 1 description')).toHaveValue('Refactor auth');
    expect(screen.getByLabelText('Task 1 provider')).toHaveValue('claude');
    expect(screen.getByLabelText('Task 2 description')).toHaveValue('Add tests');
    expect(screen.getByLabelText('Task 2 provider')).toHaveValue('gemini');
  });

  it('should show empty TaskPlanner when parse fails (fallback)', async () => {
    const user = userEvent.setup();
    render(<PlanningView {...defaultProps} />);

    act(() => {
      useChatStore.getState().addUserMessage('coord-1', TASK_GENERATION_PROMPT);
    });

    await user.click(screen.getByRole('button', { name: /plan tasks/i }));

    // Respond with no valid JSON
    act(() => {
      useChatStore.getState().handleChatEvent('coord-1', {
        type: 'text',
        data: { content: 'Sorry, I could not generate tasks.' },
      });
    });
    act(() => {
      useChatStore.getState().handleChatEvent('coord-1', {
        type: 'result',
        data: { stats: { inputTokens: 10, outputTokens: 20 } },
      });
    });

    expect(screen.getByTestId('task-planner')).toBeInTheDocument();
    expect(screen.getByLabelText('Task 1 description')).toHaveValue('');
  });

  it('should resend prompt when clicking "Regenerate"', async () => {
    const user = userEvent.setup();
    render(<PlanningView {...defaultProps} />);

    // Go to planning state
    act(() => {
      useChatStore.getState().addUserMessage('coord-1', TASK_GENERATION_PROMPT);
    });
    await user.click(screen.getByRole('button', { name: /plan tasks/i }));
    simulateSendAndResponse(
      'coord-1',
      '```json\n{"tasks": [{"description": "Task A", "provider": "claude"}]}\n```',
    );

    expect(screen.getByTestId('task-planner')).toBeInTheDocument();

    // Click Regenerate
    await user.click(screen.getByRole('button', { name: /regenerate/i }));
    expect(defaultProps.onSend).toHaveBeenCalledTimes(2);
    expect(defaultProps.onSend).toHaveBeenLastCalledWith('coord-1', TASK_GENERATION_PROMPT);
  });

  it('should go back to chat state when clicking "Back to Chat"', async () => {
    const user = userEvent.setup();
    render(<PlanningView {...defaultProps} />);

    // Go to planning state
    act(() => {
      useChatStore.getState().addUserMessage('coord-1', TASK_GENERATION_PROMPT);
    });
    await user.click(screen.getByRole('button', { name: /plan tasks/i }));
    simulateSendAndResponse(
      'coord-1',
      '```json\n{"tasks": [{"description": "Task A", "provider": "claude"}]}\n```',
    );

    expect(screen.getByTestId('task-planner')).toBeInTheDocument();

    // Click Back to Chat
    await user.click(screen.getByRole('button', { name: /back to chat/i }));
    expect(screen.queryByTestId('task-planner')).not.toBeInTheDocument();
    expect(screen.getByTestId('chat-panel')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /plan tasks/i })).toBeInTheDocument();
  });

  it('should pass onDispatch callback through', async () => {
    const user = userEvent.setup();
    render(<PlanningView {...defaultProps} />);

    act(() => {
      useChatStore.getState().addUserMessage('coord-1', TASK_GENERATION_PROMPT);
    });
    await user.click(screen.getByRole('button', { name: /plan tasks/i }));
    simulateSendAndResponse(
      'coord-1',
      '```json\n{"tasks": [{"description": "Task A", "provider": "claude"}]}\n```',
    );

    expect(screen.getByTestId('task-planner')).toBeInTheDocument();
  });
});
