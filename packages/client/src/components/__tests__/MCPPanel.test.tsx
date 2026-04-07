import { segments as s } from '@code-quest/summoner/test';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { createFakeSummoner } from '../../test/fake-summoner';
import { emitAssistantTurn, sendUserMessage } from '../../test/helpers';
import { renderWithWorkspace } from '../../test/render-with-workspace';
import { MCPPanel } from '../MCPPanel';

let _sessionSeq = 0;
const uniqueSession = () => `cli-sess-${++_sessionSeq}`;

function createSocketCallback<T>(_event: string, response: T) {
  return (..._args: unknown[]) => Promise.resolve(response);
}

// ── V3 pipeline setup ──

interface McpSetupOptions {
  mcpServers?: Array<{ name: string; status: string; scope?: string }>;
}

async function setupPipeline(opts?: McpSetupOptions) {
  const summoner = createFakeSummoner();
  summoner
    .claude()
    .prepareInit(s.init(uniqueSession(), opts?.mcpServers ? { mcpServers: opts.mcpServers } : {}));
  return renderWithWorkspace({ summoner });
}

async function setupWithTurn(opts?: McpSetupOptions) {
  const ctx = await setupPipeline(opts);
  await sendUserMessage(ctx.user, 'hello');
  await emitAssistantTurn(ctx.claude);
  return ctx;
}

async function openMcpManageDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByTitle('Show command menu (/)'));
  await user.click(await screen.findByText('Manage MCP servers'));
}

async function openMcpStatusDialog(user: ReturnType<typeof userEvent.setup>) {
  const textarea = screen.getAllByRole('textbox').find((el) => el.tagName === 'TEXTAREA')!;
  await user.type(textarea, '/mcp');
  await user.click(await screen.findByText('MCP status'));
}

async function openManageDialogViaSlash(user: ReturnType<typeof userEvent.setup>) {
  const textarea = screen.getAllByRole('textbox').find((el) => el.tagName === 'TEXTAREA')!;
  await user.type(textarea, '/mcp');
  await user.click(await screen.findByText('Manage MCP servers'));
}

// ── Tests ──

describe('MCPPanel', () => {
  it('opens MCP dialog via action menu', async () => {
    const { claude, user } = await setupPipeline();
    await sendUserMessage(user);
    await emitAssistantTurn(claude, 'ok');

    await openMcpManageDialog(user);

    expect(await screen.findByRole('dialog', { name: /manage mcp servers/i })).toBeInTheDocument();
  });

  it('shows empty state when no MCP servers', () => {
    render(<MCPPanel servers={[]} onToggle={vi.fn()} onReconnect={vi.fn()} onRefresh={vi.fn()} />);

    expect(screen.getByText(/no.*server/i)).toBeInTheDocument();
  });

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
      success: true,
      authUrl: 'https://auth.example.com',
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
      success: true,
      authUrl: 'https://auth.example.com',
    });
    const onOAuthCallback = createSocketCallback('submit_mcp_oauth_callback_url', {
      success: true,
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
    expect(result).toEqual({ success: true });
  });

  it('shows error when auth fails', async () => {
    const user = userEvent.setup();
    const onAuth = createSocketCallback('authenticate_mcp_server', {
      success: false,
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

  it('shows failed badge when system/init has failed mcp server', async () => {
    const { user } = await setupWithTurn({
      mcpServers: [{ name: 'pencil', status: 'failed' }],
    });
    await openMcpManageDialog(user);

    expect(screen.getByText('✗ Failed')).toBeInTheDocument();
    expect(screen.getByText('pencil')).toBeInTheDocument();
  });

  it('shows needs-auth badge when system/init has needs-auth mcp servers', async () => {
    const { user } = await setupWithTurn({
      mcpServers: [
        { name: 'claude.ai Google Calendar', status: 'needs-auth' },
        { name: 'claude.ai Gmail', status: 'needs-auth' },
      ],
    });
    await openMcpManageDialog(user);

    expect(screen.getAllByText('⚠ Needs Auth')).toHaveLength(2);
    expect(screen.getByText('claude.ai Google Calendar')).toBeInTheDocument();
    expect(screen.getByText('claude.ai Gmail')).toBeInTheDocument();
  });

  it('shows disabled badge for disabled mcp servers', async () => {
    const { user } = await setupWithTurn({
      mcpServers: [{ name: 'pencil', status: 'disabled' }],
    });
    await openMcpManageDialog(user);

    expect(screen.getByText('○ Disabled')).toBeInTheDocument();
  });
});

describe('McpStatusDialog', () => {
  it('opens MCP status dialog and shows plain failed badge', async () => {
    const { user } = await setupWithTurn({
      mcpServers: [{ name: 'pencil', status: 'failed' }],
    });
    await openMcpStatusDialog(user);

    expect(screen.getByRole('dialog', { name: /mcp servers/i })).toBeInTheDocument();
    expect(await screen.findByText('failed')).toBeInTheDocument();
    expect(await screen.findByText('pencil')).toBeInTheDocument();
  });

  it('shows plain needs-auth badge in MCP status dialog', async () => {
    const { user } = await setupWithTurn({
      mcpServers: [{ name: 'gcal', status: 'needs-auth' }],
    });
    await openMcpStatusDialog(user);

    expect(await screen.findByText('needs-auth')).toBeInTheDocument();
    expect(await screen.findByText('gcal')).toBeInTheDocument();
  });

  it('shows No running MCP servers when store is empty', async () => {
    const { user } = await setupWithTurn({
      mcpServers: [],
    });
    await openMcpStatusDialog(user);

    expect(screen.getByText(/no running mcp servers/i)).toBeInTheDocument();
  });

  it('shows status footer with claude mcp add and Learn more link', async () => {
    const { user } = await setupWithTurn({
      mcpServers: [{ name: 'pencil', status: 'connected' }],
    });
    await openMcpStatusDialog(user);

    expect(screen.getByText('claude mcp add')).toBeInTheDocument();
    const link = screen.getByText('Learn more');
    expect(link).toHaveAttribute('href', 'https://code.claude.com/docs/en/mcp');
  });

  it('groups servers by scope with count headers in manage dialog', async () => {
    const { user } = await setupWithTurn({
      mcpServers: [
        { name: 'pencil', status: 'failed', scope: 'user' },
        { name: 'claude.ai Gmail', status: 'needs-auth', scope: 'claudeai' },
        { name: 'claude.ai Google Calendar', status: 'needs-auth', scope: 'claudeai' },
      ],
    });
    await openManageDialogViaSlash(user);

    expect(screen.getByText('User (1)')).toBeInTheDocument();
    expect(screen.getByText('claude.ai (2)')).toBeInTheDocument();
  });

  it('infers claude.ai scope from server name in manage dialog', async () => {
    const { user } = await setupWithTurn({
      mcpServers: [{ name: 'claude.ai Gmail', status: 'needs-auth' }],
    });
    await openManageDialogViaSlash(user);

    expect(screen.getByText('claude.ai (1)')).toBeInTheDocument();
    expect(screen.getByText('claude.ai Gmail')).toBeInTheDocument();
  });

  it('shows ✗ Failed badge in manage dialog', async () => {
    const { user } = await setupWithTurn({
      mcpServers: [{ name: 'pencil', status: 'failed' }],
    });
    await openManageDialogViaSlash(user);

    expect(screen.getByText('✗ Failed')).toBeInTheDocument();
  });

  it('shows ⚠ Needs Auth badge in manage dialog', async () => {
    const { user } = await setupWithTurn({
      mcpServers: [{ name: 'gcal', status: 'needs-auth' }],
    });
    await openManageDialogViaSlash(user);

    expect(screen.getByText('⚠ Needs Auth')).toBeInTheDocument();
  });

  it('shows Learn more about MCP footer link in manage dialog', async () => {
    const { user } = await setupWithTurn({
      mcpServers: [{ name: 'pencil', status: 'connected' }],
    });
    await openManageDialogViaSlash(user);

    const link = screen.getByText('Learn more about MCP');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://code.claude.com/docs/en/mcp');
  });
});

// ── Send message section (merged from MCPPanel.unit.test.tsx) ──

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
