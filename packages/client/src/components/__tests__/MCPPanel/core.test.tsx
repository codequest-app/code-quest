import { segments as s } from '@code-quest/summoner/test';
import { render, screen } from '@testing-library/react';
import type userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { createFakeSummoner } from '../../../test/fake-summoner';
import { emitAssistantTurn, sendUserMessage } from '../../../test/helpers';
import { renderWithWorkspace } from '../../../test/render-with-workspace';
import { MCPPanel } from '../../MCPPanel';

let _sessionSeq = 0;
const uniqueSession = () => `cli-sess-${++_sessionSeq}`;

interface McpSetupOptions {
  mcpServers?: Array<{ name: string; status: string; scope?: string }>;
}

async function setupPipeline(opts?: McpSetupOptions) {
  const summoner = createFakeSummoner();
  summoner
    .claude()
    .prepareInit(s.init(uniqueSession(), opts?.mcpServers ? { mcpServers: opts.mcpServers } : {}));
  const result = await renderWithWorkspace({ summoner });
  const project = await result.addProject();
  await project.launchSession();
  return result;
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
