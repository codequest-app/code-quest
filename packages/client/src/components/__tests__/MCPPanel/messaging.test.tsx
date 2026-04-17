import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MCPPanel } from '../../MCPPanel';

function createSendMessage() {
  const calls: Array<{ serverName: string; message: unknown }> = [];
  const fn = async (serverName: string, message: Record<string, unknown>) => {
    calls.push({ serverName, message });
    return { success: true, response: {} };
  };
  return { fn, calls };
}

describe('MCPPanel send message', () => {
  it('renders send message section when onSendMessage provided', () => {
    const { fn } = createSendMessage();
    render(
      <MCPPanel
        servers={[]}
        onToggle={vi.fn()}
        onReconnect={vi.fn()}
        onRefresh={vi.fn()}
        onSendMessage={fn}
      />,
    );
    expect(screen.getByPlaceholderText(/server name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/message/i)).toBeInTheDocument();
  });

  it('calls onSendMessage with parsed JSON', async () => {
    const user = userEvent.setup();
    const { fn, calls } = createSendMessage();
    render(
      <MCPPanel
        servers={[]}
        onToggle={vi.fn()}
        onReconnect={vi.fn()}
        onRefresh={vi.fn()}
        onSendMessage={fn}
      />,
    );
    await user.type(screen.getByPlaceholderText(/server name/i), 'github');
    const messageInput = screen.getByPlaceholderText(/message/i);
    await user.click(messageInput);
    await user.paste('{"method":"ping"}');
    await user.click(screen.getByText('Send'));
    expect(calls).toEqual([{ serverName: 'github', message: { method: 'ping' } }]);
  });

  it('shows error on invalid JSON', async () => {
    const user = userEvent.setup();
    render(
      <MCPPanel
        servers={[]}
        onToggle={vi.fn()}
        onReconnect={vi.fn()}
        onRefresh={vi.fn()}
        onSendMessage={vi.fn()}
      />,
    );
    await user.type(screen.getByPlaceholderText(/message/i), 'not json');
    await user.click(screen.getByText('Send'));
    expect(screen.getByText(/invalid json/i)).toBeInTheDocument();
  });

  it('does not render send section when no onSendMessage', () => {
    render(<MCPPanel servers={[]} onToggle={vi.fn()} onReconnect={vi.fn()} onRefresh={vi.fn()} />);
    expect(screen.queryByPlaceholderText(/server name/i)).not.toBeInTheDocument();
  });
});
