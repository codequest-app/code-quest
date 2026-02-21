import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useChatStore } from '../../../stores/chatStore';
import { ChatStatusBar } from '../ChatStatusBar';

describe('ChatStatusBar', () => {
  beforeEach(() => {
    useChatStore.setState({ chatSessions: new Map() });
  });

  it('should not render when no controlInfo', () => {
    useChatStore.getState().initChatSession('s1', 'claude');
    const { container } = render(<ChatStatusBar sessionId="s1" />);
    expect(container.innerHTML).toBe('');
  });

  it('should render account email, model, and PID when controlInfo is present', () => {
    useChatStore.getState().initChatSession('s1', 'claude');
    useChatStore.getState().handleControlResponse('s1', {
      requestId: 'r1',
      success: true,
      response: {
        account: { email: 'test@example.com', subscriptionType: 'pro' },
        pid: 42,
      },
    });
    useChatStore.getState().handleControlResponse('s1', {
      requestId: 'r2',
      success: true,
      response: { models: [{ value: 'opus', displayName: 'Opus', description: 'Best' }] },
    });

    render(<ChatStatusBar sessionId="s1" />);

    expect(screen.getByTestId('chat-status-bar')).toBeInTheDocument();
    expect(screen.getByTestId('status-account')).toHaveTextContent('test@example.com');
    expect(screen.getByTestId('status-pid')).toHaveTextContent('PID: 42');
  });

  it('should render only available info (partial controlInfo)', () => {
    useChatStore.getState().initChatSession('s1', 'claude');
    useChatStore.getState().handleControlResponse('s1', {
      requestId: 'r1',
      success: true,
      response: { pid: 99 },
    });

    render(<ChatStatusBar sessionId="s1" />);

    expect(screen.getByTestId('status-pid')).toHaveTextContent('PID: 99');
    expect(screen.queryByTestId('status-account')).not.toBeInTheDocument();
    expect(screen.queryByTestId('status-model')).not.toBeInTheDocument();
  });

  it('should render ModelSelector when models are present', () => {
    useChatStore.getState().initChatSession('s1', 'claude');
    useChatStore.getState().handleControlResponse('s1', {
      requestId: 'r1',
      success: true,
      response: {
        models: [
          { value: 'opus', displayName: 'Opus', description: 'Best' },
          { value: 'sonnet', displayName: 'Sonnet', description: 'Fast' },
        ],
      },
    });

    render(<ChatStatusBar sessionId="s1" onModelChange={vi.fn()} />);

    expect(screen.getByTestId('model-selector')).toBeInTheDocument();
  });

  it('should render OutputStyleSelector when availableOutputStyles are present', () => {
    useChatStore.getState().initChatSession('s1', 'claude');
    useChatStore.getState().handleControlResponse('s1', {
      requestId: 'r1',
      success: true,
      response: {
        outputStyle: 'concise',
        availableOutputStyles: ['concise', 'verbose', 'markdown'],
      },
    });

    render(<ChatStatusBar sessionId="s1" onStyleChange={vi.fn()} />);

    expect(screen.getByTestId('output-style-selector')).toBeInTheDocument();
  });

  it('should render PermissionModeSelector when permissionMode is present', () => {
    useChatStore.getState().initChatSession('s1', 'claude');
    useChatStore.getState().handleControlResponse('s1', {
      requestId: 'r1',
      success: true,
      response: { permissionMode: 'default', pid: 1 },
    });

    render(<ChatStatusBar sessionId="s1" onModeChange={vi.fn()} />);

    expect(screen.getByTestId('permission-mode-selector')).toBeInTheDocument();
  });

  it('should not render interrupt button when not processing', () => {
    useChatStore.getState().initChatSession('s1', 'claude');
    useChatStore.getState().handleControlResponse('s1', {
      requestId: 'r1',
      success: true,
      response: { pid: 1 },
    });

    render(<ChatStatusBar sessionId="s1" isProcessing={false} />);

    expect(screen.queryByTestId('interrupt-button')).not.toBeInTheDocument();
  });

  it('should render interrupt button when processing', () => {
    useChatStore.getState().initChatSession('s1', 'claude');
    useChatStore.getState().handleControlResponse('s1', {
      requestId: 'r1',
      success: true,
      response: { pid: 1 },
    });

    render(<ChatStatusBar sessionId="s1" isProcessing={true} onInterrupt={vi.fn()} />);

    expect(screen.getByTestId('interrupt-button')).toBeInTheDocument();
  });

  it('should call onInterrupt when interrupt button is clicked', () => {
    useChatStore.getState().initChatSession('s1', 'claude');
    useChatStore.getState().handleControlResponse('s1', {
      requestId: 'r1',
      success: true,
      response: { pid: 1 },
    });

    const onInterrupt = vi.fn();
    render(<ChatStatusBar sessionId="s1" isProcessing={true} onInterrupt={onInterrupt} />);

    fireEvent.click(screen.getByTestId('interrupt-button'));
    expect(onInterrupt).toHaveBeenCalled();
  });

  it('should render ThinkingTokensInput when maxThinkingTokens is present', () => {
    useChatStore.getState().initChatSession('s1', 'claude');
    useChatStore.getState().handleControlResponse('s1', {
      requestId: 'r1',
      success: true,
      response: { maxThinkingTokens: 4096, pid: 1 },
    });

    render(<ChatStatusBar sessionId="s1" onTokensChange={vi.fn()} />);

    expect(screen.getByTestId('thinking-tokens-input')).toBeInTheDocument();
  });
});
