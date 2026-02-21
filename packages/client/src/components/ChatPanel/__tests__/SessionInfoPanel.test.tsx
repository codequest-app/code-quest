import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useChatStore } from '../../../stores/chatStore';
import { SessionInfoPanel } from '../SessionInfoPanel';

describe('SessionInfoPanel', () => {
  beforeEach(() => {
    useChatStore.setState({ chatSessions: new Map() });
  });

  it('should not render when no controlInfo', () => {
    useChatStore.getState().initChatSession('s1', 'claude');
    const { container } = render(<SessionInfoPanel sessionId="s1" />);
    expect(container.innerHTML).toBe('');
  });

  it('should render panel when controlInfo is present', () => {
    useChatStore.getState().initChatSession('s1', 'claude');
    useChatStore.getState().handleControlResponse('s1', {
      requestId: 'r1',
      success: true,
      response: { pid: 42 },
    });

    render(<SessionInfoPanel sessionId="s1" />);
    expect(screen.getByTestId('session-info-panel')).toBeInTheDocument();
  });

  it('should be collapsed by default', () => {
    useChatStore.getState().initChatSession('s1', 'claude');
    useChatStore.getState().handleControlResponse('s1', {
      requestId: 'r1',
      success: true,
      response: { pid: 42 },
    });

    render(<SessionInfoPanel sessionId="s1" />);
    expect(screen.queryByTestId('session-info-details')).not.toBeInTheDocument();
  });

  it('should expand on click and show all fields', () => {
    useChatStore.getState().initChatSession('s1', 'claude');
    useChatStore.getState().handleControlResponse('s1', {
      requestId: 'r1',
      success: true,
      response: {
        account: { email: 'test@example.com', subscriptionType: 'pro' },
        pid: 42,
        currentModel: 'opus',
        permissionMode: 'default',
        outputStyle: 'concise',
      },
    });

    render(<SessionInfoPanel sessionId="s1" />);
    fireEvent.click(screen.getByTestId('session-info-toggle'));

    const details = screen.getByTestId('session-info-details');
    expect(details).toBeInTheDocument();
    expect(details).toHaveTextContent('test@example.com');
    expect(details).toHaveTextContent('pro');
    expect(details).toHaveTextContent('42');
    expect(details).toHaveTextContent('opus');
    expect(details).toHaveTextContent('default');
    expect(details).toHaveTextContent('concise');
  });
});
