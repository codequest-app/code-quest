import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Message } from '../../types/ui';
import { ChatMessage } from '../ChatMessage';

const base: Omit<Message, 'type' | 'content' | 'meta'> = {
  id: '1',
  role: 'assistant',
  timestamp: Date.now(),
};

describe('ChatMessage', () => {
  it('renders text message with markdown', () => {
    render(<ChatMessage message={{ ...base, type: 'text', content: 'Hello **world**' }} />);
    expect(screen.getByText('world')).toBeInTheDocument();
  });

  it('renders code blocks in text messages', () => {
    const { container } = render(
      <ChatMessage message={{ ...base, type: 'text', content: '```js\nconsole.log("hi")\n```' }} />,
    );
    expect(container.textContent).toContain('console');
    expect(container.querySelector('pre')).toBeInTheDocument();
  });

  it('renders thinking message as collapsible', async () => {
    const user = userEvent.setup();
    render(<ChatMessage message={{ ...base, type: 'thinking', content: 'Let me think...' }} />);

    // Should have a details/summary or similar collapsible
    const summary = screen.getByText(/thinking/i);
    expect(summary).toBeInTheDocument();

    // Content should be accessible
    await user.click(summary);
    expect(screen.getByText('Let me think...')).toBeInTheDocument();
  });

  it('renders tool_use message with tool name and input', () => {
    render(
      <ChatMessage
        message={{
          ...base,
          type: 'tool_use',
          content: 'bash',
          meta: { toolId: 't1', input: { command: 'ls -la' } },
        }}
      />,
    );
    expect(screen.getByText(/bash/i)).toBeInTheDocument();
    expect(screen.getByText(/ls -la/)).toBeInTheDocument();
  });

  it('renders tool_result message', () => {
    render(
      <ChatMessage
        message={{
          ...base,
          type: 'tool_result',
          content: 'file.txt\nREADME.md',
          meta: { toolId: 't1', name: 'bash' },
        }}
      />,
    );
    expect(screen.getByText(/file\.txt/)).toBeInTheDocument();
  });

  it('renders error message in red', () => {
    render(
      <ChatMessage
        message={{ ...base, role: 'system', type: 'error', content: 'Something broke' }}
      />,
    );
    const el = screen.getByText('Something broke');
    expect(el).toBeInTheDocument();
    expect(el.closest('.chat-message--error')).toBeInTheDocument();
  });

  it('renders control_request message', () => {
    render(
      <ChatMessage
        message={{
          ...base,
          type: 'control_request',
          content: 'bash',
          meta: { requestId: 'r1', input: { command: 'rm -rf /' } },
        }}
      />,
    );
    expect(screen.getByText(/bash/i)).toBeInTheDocument();
    expect(screen.getByText(/tool approval/i)).toBeInTheDocument();
  });

  it('renders user messages with user role styling', () => {
    render(<ChatMessage message={{ ...base, role: 'user', type: 'text', content: 'Hi there' }} />);
    const el = screen.getByText('Hi there');
    expect(el.closest('.chat-message--user')).toBeInTheDocument();
  });
});
