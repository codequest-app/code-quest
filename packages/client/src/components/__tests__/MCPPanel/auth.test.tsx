import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MCPPanel } from '../../MCPPanel';

function createSocketCallback<T>(_event: string, response: T) {
  return (..._args: unknown[]) => Promise.resolve(response);
}

describe('MCPPanel', () => {
  it('shows Auth button when onAuthenticate provided', () => {
    render(
      <MCPPanel
        servers={[{ name: 'test-server', enabled: true, status: 'connected' }]}
        onToggle={vi.fn()}
        onReconnect={vi.fn()}
        onRefresh={vi.fn()}
        onAuthenticate={vi.fn()}
      />,
    );
    expect(screen.getByTitle('Auth test-server')).toBeInTheDocument();
  });

  it('calls onAuthenticate and shows auth URL', async () => {
    const user = userEvent.setup();
    const onAuth = createSocketCallback('authenticate_mcp_server', {
      ok: true as const,
      data: { authUrl: 'https://auth.example.com' },
    });
    render(
      <MCPPanel
        servers={[{ name: 'test-server', enabled: true, status: 'connected' }]}
        onToggle={vi.fn()}
        onReconnect={vi.fn()}
        onRefresh={vi.fn()}
        onAuthenticate={onAuth}
      />,
    );
    await user.click(screen.getByTitle('Auth test-server'));
    expect(await screen.findByText(/complete authentication/i)).toBeInTheDocument();
    expect(screen.getByText(/complete authentication/i).closest('a')).toHaveAttribute(
      'href',
      'https://auth.example.com',
    );
  });

  it('shows callback URL input after auth returns authUrl and submits it', async () => {
    const user = userEvent.setup();
    const onAuth = createSocketCallback('authenticate_mcp_server', {
      ok: true as const,
      data: { authUrl: 'https://auth.example.com' },
    });
    const onOAuthCallback = createSocketCallback('submit_mcp_oauth_callback_url', {
      ok: true as const,
      data: {},
    });
    render(
      <MCPPanel
        servers={[{ name: 'test-server', enabled: true, status: 'connected' }]}
        onToggle={vi.fn()}
        onReconnect={vi.fn()}
        onRefresh={vi.fn()}
        onAuthenticate={onAuth}
        onOAuthCallback={onOAuthCallback}
      />,
    );
    await user.click(screen.getByTitle('Auth test-server'));
    expect(await screen.findByText(/complete authentication/i)).toBeInTheDocument();
    const callbackInput = screen.getByPlaceholderText(/callback url/i);
    expect(callbackInput).toBeInTheDocument();
    await user.type(callbackInput, 'https://example.com/callback?code=abc');
    await user.click(screen.getByText('Submit'));
    const result = await onOAuthCallback('test-server', 'https://example.com/callback?code=abc');
    expect(result).toEqual({ ok: true, data: {} });
  });

  it('shows error when auth fails', async () => {
    const user = userEvent.setup();
    const onAuth = createSocketCallback('authenticate_mcp_server', {
      ok: false as const,
      error: 'Auth denied',
    });
    render(
      <MCPPanel
        servers={[{ name: 'test-server', enabled: true, status: 'connected' }]}
        onToggle={vi.fn()}
        onReconnect={vi.fn()}
        onRefresh={vi.fn()}
        onAuthenticate={onAuth}
      />,
    );
    await user.click(screen.getByTitle('Auth test-server'));
    expect(await screen.findByText('Auth denied')).toBeInTheDocument();
  });
});
