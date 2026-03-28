import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { McpServerRow } from '../McpServerRow';

const server = { name: 'my-mcp', enabled: true, status: 'connected' as const };
const noop = vi.fn();

describe('McpServerRow', () => {
  it('renders server name and status dot', () => {
    render(<McpServerRow server={server} onToggle={noop} onReconnect={noop} showFeedback={noop} />);
    expect(screen.getByText('my-mcp')).toBeInTheDocument();
  });

  it('does not render Clear Auth button when onClearAuth is not provided', () => {
    render(<McpServerRow server={server} onToggle={noop} onReconnect={noop} showFeedback={noop} />);
    expect(screen.queryByTitle('Clear Auth my-mcp')).not.toBeInTheDocument();
  });

  it('renders Clear Auth button when onClearAuth is provided', () => {
    render(
      <McpServerRow
        server={server}
        onToggle={noop}
        onReconnect={noop}
        showFeedback={noop}
        onClearAuth={vi.fn().mockResolvedValue({ success: true })}
      />,
    );
    expect(screen.getByTitle('Clear Auth my-mcp')).toBeInTheDocument();
  });

  it('calls onClearAuth with server name and shows success feedback', async () => {
    const user = userEvent.setup();
    const onClearAuth = vi.fn().mockResolvedValue({ success: true });
    const showFeedback = vi.fn();
    render(
      <McpServerRow
        server={server}
        onToggle={noop}
        onReconnect={noop}
        showFeedback={showFeedback}
        onClearAuth={onClearAuth}
      />,
    );
    await user.click(screen.getByTitle('Clear Auth my-mcp'));
    expect(onClearAuth).toHaveBeenCalledWith('my-mcp');
    expect(showFeedback).toHaveBeenCalledWith('my-mcp auth cleared', 'success');
  });

  it('shows error feedback when onClearAuth fails', async () => {
    const user = userEvent.setup();
    const onClearAuth = vi.fn().mockResolvedValue({ success: false, error: 'Token not found' });
    const showFeedback = vi.fn();
    render(
      <McpServerRow
        server={server}
        onToggle={noop}
        onReconnect={noop}
        showFeedback={showFeedback}
        onClearAuth={onClearAuth}
      />,
    );
    await user.click(screen.getByTitle('Clear Auth my-mcp'));
    expect(showFeedback).toHaveBeenCalledWith('Token not found', 'error');
  });
});
