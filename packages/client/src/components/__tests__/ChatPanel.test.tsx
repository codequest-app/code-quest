import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useChatStore } from '../../stores/chat-store';
import { makeFakeSocket } from '../../test/make-fake-socket';
import { ChatPanel } from '../ChatPanel';

beforeEach(() => {
  useChatStore.setState({
    sessionId: null,
    status: 'disconnected',
    messages: [],
    pendingControl: null,
    stats: null,
  });
});

describe('ChatPanel', () => {
  it('renders input and message list', () => {
    const socket = makeFakeSocket();
    render(<ChatPanel socket={socket} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('calls createSession on mount', () => {
    const socket = makeFakeSocket();
    render(<ChatPanel socket={socket} />);
    expect(socket.emit).toHaveBeenCalledWith('chat:create', {}, expect.any(Function));
  });

  it('sends message via input', async () => {
    const user = userEvent.setup();
    const socket = makeFakeSocket();
    render(<ChatPanel socket={socket} />);

    await user.type(screen.getByRole('textbox'), 'test message{Enter}');
    expect(socket.emit).toHaveBeenCalledWith('chat:send', {
      sessionId: 'session-1',
      message: 'test message',
    });
  });

  it('displays messages from store', () => {
    const socket = makeFakeSocket();
    useChatStore.setState({
      sessionId: 'test-session',
      status: 'idle',
      messages: [
        { id: '1', role: 'user', type: 'text', content: 'Hello', timestamp: Date.now() },
        { id: '2', role: 'assistant', type: 'text', content: 'Hi back', timestamp: Date.now() },
      ],
    });
    render(<ChatPanel socket={socket} />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText(/Hi back/)).toBeInTheDocument();
  });

  it('shows control request banner when pending', () => {
    const socket = makeFakeSocket();
    useChatStore.setState({
      sessionId: 'test-session',
      status: 'idle',
      pendingControl: { requestId: 'r1', subtype: 'tool_approval', toolName: 'bash' },
    });
    render(<ChatPanel socket={socket} />);
    expect(screen.getByText(/bash/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /approve/i })).toBeInTheDocument();
  });

  it('shows stats bar when stats available', () => {
    const socket = makeFakeSocket();
    useChatStore.setState({
      sessionId: 'test-session',
      status: 'idle',
      stats: { costUsd: 0.05, durationMs: 1200 },
    });
    render(<ChatPanel socket={socket} />);
    expect(screen.getByText(/\$0\.05/)).toBeInTheDocument();
  });

  it('disables input when processing', () => {
    const socket = makeFakeSocket();
    render(<ChatPanel socket={socket} />);

    // Simulate processing state after session is created
    act(() => useChatStore.setState({ status: 'processing' }));
    expect(screen.getByRole('textbox')).toBeDisabled();
  });
});
