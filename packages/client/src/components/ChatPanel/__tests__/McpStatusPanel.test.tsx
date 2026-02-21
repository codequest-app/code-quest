import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { McpStatusPanel } from '../McpStatusPanel';

describe('McpStatusPanel', () => {
  const servers = [
    { name: 'mcp-git', status: 'connected' },
    { name: 'mcp-fs', status: 'failed', error: 'connection timeout', scope: 'project' },
  ];

  it('should not render when no mcpServers', () => {
    const { container } = render(<McpStatusPanel />);
    expect(container.innerHTML).toBe('');
  });

  it('should not render when mcpServers is empty', () => {
    const { container } = render(<McpStatusPanel mcpServers={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('should render toggle header when servers exist', () => {
    render(<McpStatusPanel mcpServers={servers} />);
    expect(screen.getByTestId('mcp-header-toggle')).toBeInTheDocument();
  });

  it('should be collapsed by default', () => {
    render(<McpStatusPanel mcpServers={servers} />);
    expect(screen.queryByTestId('mcp-server-list')).not.toBeInTheDocument();
  });

  it('should expand on header click', () => {
    render(<McpStatusPanel mcpServers={servers} />);
    fireEvent.click(screen.getByTestId('mcp-header-toggle'));
    expect(screen.getByTestId('mcp-server-list')).toBeInTheDocument();
  });

  it('should render server list when expanded', () => {
    render(<McpStatusPanel mcpServers={servers} />);
    fireEvent.click(screen.getByTestId('mcp-header-toggle'));

    expect(screen.getByTestId('mcp-server-mcp-git')).toBeInTheDocument();
    expect(screen.getByTestId('mcp-server-mcp-fs')).toBeInTheDocument();
  });

  it('should show error for failed server', () => {
    render(<McpStatusPanel mcpServers={servers} />);
    fireEvent.click(screen.getByTestId('mcp-header-toggle'));

    expect(screen.getByTestId('mcp-error-mcp-fs')).toHaveTextContent('connection timeout');
    expect(screen.queryByTestId('mcp-error-mcp-git')).not.toBeInTheDocument();
  });

  it('should call onToggle when Toggle button is clicked', () => {
    const onToggle = vi.fn();
    render(<McpStatusPanel mcpServers={servers} onToggle={onToggle} />);
    fireEvent.click(screen.getByTestId('mcp-header-toggle'));
    fireEvent.click(screen.getByTestId('mcp-toggle-mcp-git'));
    expect(onToggle).toHaveBeenCalledWith('mcp-git');
  });

  it('should call onReconnect when Reconnect button is clicked', () => {
    const onReconnect = vi.fn();
    render(<McpStatusPanel mcpServers={servers} onReconnect={onReconnect} />);
    fireEvent.click(screen.getByTestId('mcp-header-toggle'));
    fireEvent.click(screen.getByTestId('mcp-reconnect-mcp-fs'));
    expect(onReconnect).toHaveBeenCalledWith('mcp-fs');
  });

  it('should render Refresh button in header', () => {
    render(<McpStatusPanel mcpServers={servers} onRefresh={vi.fn()} />);
    expect(screen.getByTestId('mcp-refresh-button')).toBeInTheDocument();
  });

  it('should call onRefresh when Refresh button is clicked', () => {
    const onRefresh = vi.fn();
    render(<McpStatusPanel mcpServers={servers} onRefresh={onRefresh} />);
    fireEvent.click(screen.getByTestId('mcp-refresh-button'));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
