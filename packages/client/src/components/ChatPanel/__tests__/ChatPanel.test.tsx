import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useChatStore } from '../../../stores/chatStore';
import { ChatPanel } from '../ChatPanel';

describe('ChatPanel', () => {
  const mockOnSend = vi.fn();
  const mockOnAbort = vi.fn();
  const mockOnAllowTool = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useChatStore.setState({
      chatSessions: new Map(),
    });
  });

  function renderPanel(sessionId = 'test-1') {
    return render(
      <ChatPanel
        sessionId={sessionId}
        onSend={mockOnSend}
        onAbort={mockOnAbort}
        onAllowTool={mockOnAllowTool}
      />,
    );
  }

  it('should render chat panel with input area', () => {
    useChatStore.getState().initChatSession('test-1', 'claude');
    renderPanel();

    expect(screen.getByTestId('chat-panel')).toBeInTheDocument();
    expect(screen.getByTestId('chat-input')).toBeInTheDocument();
  });

  it('should show "Session not found" for invalid session', () => {
    renderPanel('non-existent');

    expect(screen.getByText('Session not found')).toBeInTheDocument();
  });

  it('should show empty state when no messages', () => {
    useChatStore.getState().initChatSession('test-1', 'claude');
    renderPanel();

    expect(screen.getByText(/Start a conversation/)).toBeInTheDocument();
  });

  it('should render message bubbles for each message', () => {
    useChatStore.getState().initChatSession('test-1', 'claude');
    useChatStore.getState().addUserMessage('test-1', 'Hello!');
    useChatStore.getState().handleChatEvent('test-1', {
      type: 'text',
      data: { content: 'Hi there!' },
    });

    renderPanel();

    expect(screen.getByTestId('message-user')).toBeInTheDocument();
    expect(screen.getByTestId('message-assistant')).toBeInTheDocument();
  });

  it('should delegate onSend to parent with sessionId', () => {
    useChatStore.getState().initChatSession('test-1', 'claude');
    renderPanel();

    const input = screen.getByLabelText('Message input');
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(screen.getByLabelText('Send'));

    expect(mockOnSend).toHaveBeenCalledWith('test-1', 'Test message');
  });

  it('should delegate onAbort to parent with sessionId', () => {
    useChatStore.getState().initChatSession('test-1', 'claude');
    useChatStore.getState().addUserMessage('test-1', 'Hi');

    renderPanel();

    fireEvent.click(screen.getByLabelText('Stop'));
    expect(mockOnAbort).toHaveBeenCalledWith('test-1');
  });

  it('should show permission prompt when tool was denied (tool_use without tool_result)', () => {
    useChatStore.getState().initChatSession('test-1', 'claude');
    useChatStore.getState().addUserMessage('test-1', 'Read a file');
    // tool_use without matching tool_result → denied
    useChatStore.getState().handleChatEvent('test-1', {
      type: 'tool_use',
      data: { id: 'toolu_1', name: 'Read', input: { file_path: 'test.ts' } },
    });
    useChatStore.getState().handleChatEvent('test-1', {
      type: 'result',
      data: { stats: {} },
    });

    renderPanel();

    expect(screen.getByTestId('permission-prompt')).toBeInTheDocument();
  });

  it('should call onAllowTool when Allow is clicked', () => {
    useChatStore.getState().initChatSession('test-1', 'claude');
    useChatStore.getState().addUserMessage('test-1', 'Read a file');
    // Simulate denied tool
    useChatStore.getState().handleChatEvent('test-1', {
      type: 'tool_use',
      data: { id: 'toolu_1', name: 'Read', input: { file_path: 'test.ts' } },
    });
    useChatStore.getState().handleChatEvent('test-1', {
      type: 'result',
      data: { stats: {} },
    });

    renderPanel();

    fireEvent.click(screen.getByLabelText('Allow'));
    expect(mockOnAllowTool).toHaveBeenCalledWith('test-1', 'Read');
  });

  it('should not show permission prompt when no pending permission', () => {
    useChatStore.getState().initChatSession('test-1', 'claude');
    renderPanel();

    expect(screen.queryByTestId('permission-prompt')).not.toBeInTheDocument();
  });

  it('should show question prompt when pendingQuestion exists', () => {
    useChatStore.getState().initChatSession('test-1', 'claude');
    useChatStore.getState().addUserMessage('test-1', 'Help me');
    useChatStore.getState().handleChatEvent('test-1', {
      type: 'tool_use',
      data: {
        id: 'toolu_ask_1',
        name: 'AskUserQuestion',
        input: {
          questions: [
            {
              question: 'Which option?',
              header: 'Choice',
              options: [{ label: 'A' }, { label: 'B' }],
            },
          ],
        },
      },
    });
    useChatStore.getState().handleChatEvent('test-1', {
      type: 'result',
      data: { stats: {} },
    });

    renderPanel();

    expect(screen.getByTestId('question-prompt')).toBeInTheDocument();
    expect(screen.getByText('Which option?')).toBeInTheDocument();
    expect(screen.queryByTestId('permission-prompt')).not.toBeInTheDocument();
  });

  it('should call onSend when question option is selected', () => {
    useChatStore.getState().initChatSession('test-1', 'claude');
    useChatStore.getState().addUserMessage('test-1', 'Help me');
    useChatStore.getState().handleChatEvent('test-1', {
      type: 'tool_use',
      data: {
        id: 'toolu_ask_1',
        name: 'AskUserQuestion',
        input: {
          questions: [
            {
              question: 'Which option?',
              options: [{ label: 'Option A' }, { label: 'Option B' }],
            },
          ],
        },
      },
    });
    useChatStore.getState().handleChatEvent('test-1', {
      type: 'result',
      data: { stats: {} },
    });

    renderPanel();

    fireEvent.click(screen.getByTestId('question-option-0-0'));
    expect(mockOnSend).toHaveBeenCalledWith('test-1', 'Option A');
    // pendingQuestion should be cleared
    expect(useChatStore.getState().getChatSession('test-1')?.pendingQuestion).toBeUndefined();
  });

  it('should not show question prompt when no pendingQuestion', () => {
    useChatStore.getState().initChatSession('test-1', 'claude');
    renderPanel();

    expect(screen.queryByTestId('question-prompt')).not.toBeInTheDocument();
  });
});
