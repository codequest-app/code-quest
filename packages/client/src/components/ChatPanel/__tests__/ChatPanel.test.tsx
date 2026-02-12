import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatPanel } from '../ChatPanel';
import { useChatStore } from '../../../stores/chatStore';

describe('ChatPanel', () => {
  const mockOnSend = vi.fn();
  const mockOnAbort = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useChatStore.setState({
      chatSessions: new Map(),
    });
  });

  it('should render input box and send button', () => {
    useChatStore.getState().initChatSession('test-1', 'claude');

    render(
      <ChatPanel sessionId="test-1" onSend={mockOnSend} onAbort={mockOnAbort} />
    );

    expect(screen.getByLabelText('Message input')).toBeInTheDocument();
    expect(screen.getByLabelText('Send')).toBeInTheDocument();
  });

  it('should display user message after send', () => {
    useChatStore.getState().initChatSession('test-1', 'claude');
    useChatStore.getState().addUserMessage('test-1', 'Hello!');

    render(
      <ChatPanel sessionId="test-1" onSend={mockOnSend} onAbort={mockOnAbort} />
    );

    expect(screen.getByText('Hello!')).toBeInTheDocument();
    expect(screen.getByTestId('message-user')).toBeInTheDocument();
  });

  it('should display assistant message from stream events', () => {
    useChatStore.getState().initChatSession('test-1', 'claude');
    useChatStore.getState().addUserMessage('test-1', 'Hi');
    useChatStore.getState().handleChatEvent('test-1', {
      type: 'text',
      data: { content: 'Hello there!' },
    });

    render(
      <ChatPanel sessionId="test-1" onSend={mockOnSend} onAbort={mockOnAbort} />
    );

    expect(screen.getByText('Hello there!')).toBeInTheDocument();
    expect(screen.getByTestId('message-assistant')).toBeInTheDocument();
  });

  it('should disable input during processing', () => {
    useChatStore.getState().initChatSession('test-1', 'claude');
    useChatStore.getState().addUserMessage('test-1', 'Hi');

    render(
      <ChatPanel sessionId="test-1" onSend={mockOnSend} onAbort={mockOnAbort} />
    );

    expect(screen.getByLabelText('Message input')).toBeDisabled();
    expect(screen.getByLabelText('Stop')).toBeInTheDocument();
  });

  it('should render collapsible tool_use blocks', () => {
    useChatStore.getState().initChatSession('test-1', 'claude');
    useChatStore.getState().addUserMessage('test-1', 'Read a file');
    useChatStore.getState().handleChatEvent('test-1', {
      type: 'tool_use',
      data: { name: 'Read', input: { file_path: 'test.ts' } },
    });

    render(
      <ChatPanel sessionId="test-1" onSend={mockOnSend} onAbort={mockOnAbort} />
    );

    expect(screen.getByTestId('tool-use-block')).toBeInTheDocument();
    expect(screen.getByText('Read')).toBeInTheDocument();
  });

  it('should show stats after response completes', () => {
    useChatStore.getState().initChatSession('test-1', 'claude');
    useChatStore.getState().addUserMessage('test-1', 'Hi');
    useChatStore.getState().handleChatEvent('test-1', {
      type: 'text',
      data: { content: 'Hello!' },
    });
    useChatStore.getState().handleChatEvent('test-1', {
      type: 'result',
      data: { stats: { costUsd: 0.001, durationMs: 500, inputTokens: 10, outputTokens: 5 } },
    });

    render(
      <ChatPanel sessionId="test-1" onSend={mockOnSend} onAbort={mockOnAbort} />
    );

    expect(screen.getByTestId('stats-bar')).toBeInTheDocument();
    expect(screen.getByText(/\$0\.0010/)).toBeInTheDocument();
  });

  it('should call onSend when send button clicked', () => {
    useChatStore.getState().initChatSession('test-1', 'claude');

    render(
      <ChatPanel sessionId="test-1" onSend={mockOnSend} onAbort={mockOnAbort} />
    );

    const input = screen.getByLabelText('Message input');
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(screen.getByLabelText('Send'));

    expect(mockOnSend).toHaveBeenCalledWith('test-1', 'Test message');
  });

  it('should render thinking block', () => {
    useChatStore.getState().initChatSession('test-1', 'claude');
    useChatStore.getState().addUserMessage('test-1', 'Think');
    useChatStore.getState().handleChatEvent('test-1', {
      type: 'thinking',
      data: { content: 'Let me ponder...' },
    });

    render(
      <ChatPanel sessionId="test-1" onSend={mockOnSend} onAbort={mockOnAbort} />
    );

    expect(screen.getByTestId('thinking-block')).toBeInTheDocument();
  });
});
