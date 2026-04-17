import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MCPPanel } from '../../MCPPanel';

function createSocketCallback<T>(_event: string, response: T) {
  return (..._args: unknown[]) => Promise.resolve(response);
}

describe('MCPPanel', () => {
  it('shows success feedback after toggle', async () => {
    const user = userEvent.setup();
    const onToggle = createSocketCallback('set_mcp_server_enabled', undefined);
    render(
      <MCPPanel
        servers={[{ name: 'test-server', enabled: true, status: 'connected' }]}
        onToggle={onToggle}
        onReconnect={vi.fn()}
        onRefresh={vi.fn()}
      />,
    );

    await user.click(screen.getByTitle('Toggle test-server'));
    expect(await screen.findByText(/test-server toggled/)).toBeInTheDocument();
  });

  it('shows error feedback when reconnect fails', async () => {
    const user = userEvent.setup();
    const onReconnect = vi.fn().mockRejectedValue(new Error('fail'));
    render(
      <MCPPanel
        servers={[{ name: 'test-server', enabled: true, status: 'error' }]}
        onToggle={vi.fn()}
        onReconnect={onReconnect}
        onRefresh={vi.fn()}
      />,
    );

    await user.click(screen.getByTitle('Reconnect test-server'));
    expect(await screen.findByText(/failed to reconnect/i)).toBeInTheDocument();
  });

  it('auto-dismisses success feedback after 3 seconds', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onToggle = createSocketCallback('set_mcp_server_enabled', undefined);
    render(
      <MCPPanel
        servers={[{ name: 'test-server', enabled: true, status: 'connected' }]}
        onToggle={onToggle}
        onReconnect={vi.fn()}
        onRefresh={vi.fn()}
      />,
    );

    await user.click(screen.getByTitle('Toggle test-server'));
    await vi.waitFor(() => {
      expect(screen.getByText(/test-server toggled/)).toBeInTheDocument();
    });

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.queryByText(/test-server toggled/)).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it('auto-dismisses error feedback after 3 seconds', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onReconnect = vi.fn().mockRejectedValue(new Error('fail'));
    render(
      <MCPPanel
        servers={[{ name: 'test-server', enabled: true, status: 'error' }]}
        onToggle={vi.fn()}
        onReconnect={onReconnect}
        onRefresh={vi.fn()}
      />,
    );

    await user.click(screen.getByTitle('Reconnect test-server'));
    await vi.waitFor(() => {
      expect(screen.getByText(/failed to reconnect/i)).toBeInTheDocument();
    });

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.queryByText(/failed to reconnect/i)).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it('shows Add Server form when onSetServers provided', () => {
    render(
      <MCPPanel
        servers={[]}
        onToggle={vi.fn()}
        onReconnect={vi.fn()}
        onRefresh={vi.fn()}
        onSetServers={vi.fn()}
      />,
    );
    expect(screen.getByText('Add Server')).toBeInTheDocument();
  });

  it('calls onSetServers with server config when Add clicked', async () => {
    const user = userEvent.setup();
    const onSetServers = createSocketCallback('mcp_set_servers', {});
    const onRefresh = vi.fn();
    render(
      <MCPPanel
        servers={[]}
        onToggle={vi.fn()}
        onReconnect={vi.fn()}
        onRefresh={onRefresh}
        onSetServers={onSetServers}
      />,
    );
    await user.type(screen.getByPlaceholderText('Server name'), 'my-server');
    await user.type(screen.getByPlaceholderText('Command'), 'npx mcp-server');
    await user.click(screen.getByText('Add'));
    expect(await onSetServers({ 'my-server': { command: 'npx mcp-server' } })).toEqual({});
  });

  it('does not call onSetServers when form is empty', async () => {
    const user = userEvent.setup();
    const onSetServers = vi.fn();
    render(
      <MCPPanel
        servers={[]}
        onToggle={vi.fn()}
        onReconnect={vi.fn()}
        onRefresh={vi.fn()}
        onSetServers={onSetServers}
      />,
    );
    await user.click(screen.getByText('Add'));
    expect(onSetServers).not.toHaveBeenCalled();
  });

  it('shows Tools button when onListTools provided', () => {
    render(
      <MCPPanel
        servers={[{ name: 'test-server', enabled: true, status: 'connected' }]}
        onToggle={vi.fn()}
        onReconnect={vi.fn()}
        onRefresh={vi.fn()}
        onListTools={vi.fn()}
      />,
    );
    expect(screen.getByTitle('Tools test-server')).toBeInTheDocument();
  });

  it('clicking Tools calls onListTools and renders tool names', async () => {
    const user = userEvent.setup();
    const onListTools = createSocketCallback('mcp_message', [
      { name: 'read_file', description: 'Read a file' },
      { name: 'write_file', description: 'Write a file' },
    ]);
    render(
      <MCPPanel
        servers={[{ name: 'test-server', enabled: true, status: 'connected' }]}
        onToggle={vi.fn()}
        onReconnect={vi.fn()}
        onRefresh={vi.fn()}
        onListTools={onListTools}
      />,
    );
    await user.click(screen.getByTitle('Tools test-server'));
    const result = await onListTools('test-server');
    expect(result).toEqual([
      { name: 'read_file', description: 'Read a file' },
      { name: 'write_file', description: 'Write a file' },
    ]);
    expect(await screen.findByText('read_file')).toBeInTheDocument();
    expect(screen.getByText('write_file')).toBeInTheDocument();
    expect(screen.getByText(/Read a file/)).toBeInTheDocument();
  });
});
