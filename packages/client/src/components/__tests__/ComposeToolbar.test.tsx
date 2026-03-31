import { segments as s } from '@code-quest/summoner/test';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ChannelProvider, useChannelMessages } from '../../contexts/channel';
import { PluginProvider } from '../../contexts/PluginContext';
import { SessionProvider } from '../../contexts/SessionContext';
import { SocketProvider } from '../../contexts/SocketContext';
import { TabProvider } from '../../contexts/TabContext';
import { createFakeClaude } from '../../test/fake-claude';
import { renderWithWorkspace } from '../../test/render-with-workspace';
import { ComposeToolbar } from '../ComposeToolbar';

/** Helper to trigger sendMessage from context */
function SendButton() {
  const { sendMessage } = useChannelMessages();
  return (
    <button type="button" onClick={() => sendMessage('go')}>
      TriggerSend
    </button>
  );
}

async function renderWithProviders(opts?: {
  initOpts?: Parameters<typeof s.init>[1];
  controlResponse?: string;
}) {
  const claude = createFakeClaude();
  const channelId = crypto.randomUUID();
  const result = render(
    <SocketProvider socket={claude.socket}>
      <SessionProvider>
        <PluginProvider>
          <TabProvider>
            <ChannelProvider channelId={channelId}>
              <SendButton />
              <ComposeToolbar />
            </ChannelProvider>
          </TabProvider>
        </PluginProvider>
      </SessionProvider>
    </SocketProvider>,
  );
  const initSegment = s.init('sess-1', opts?.initOpts);
  const args: Array<string | { launch: { channelId: string } }> = [initSegment];
  if (opts?.controlResponse) args.push(opts.controlResponse);
  args.push({ launch: { channelId } });
  await act(async () => {
    await claude.initialize(...args);
  });
  return { claude, channelId, ...result };
}

describe('ComposeToolbar', () => {
  describe('send and stop', () => {
    it('renders send button when idle', async () => {
      await renderWithProviders();
      expect(screen.getByTitle('Send')).toBeInTheDocument();
    });

    it('renders stop button when processing', async () => {
      await renderWithProviders();
      await userEvent.click(screen.getByText('TriggerSend'));
      expect(screen.getByTitle('Stop')).toBeInTheDocument();
    });

    it('send button is disabled when no text', async () => {
      await renderWithProviders();
      expect(screen.getByTitle('Send')).toBeDisabled();
    });
  });

  describe('permission mode', () => {
    it('shows "Ask before edits" for normal mode', async () => {
      await renderWithProviders({ initOpts: { permissionMode: 'normal' } });
      expect(screen.getByText('Ask before edits')).toBeInTheDocument();
    });

    it('shows "Edit automatically" for acceptEdits mode', async () => {
      await renderWithProviders({ initOpts: { permissionMode: 'acceptEdits' } });
      expect(screen.getByText('Edit automatically')).toBeInTheDocument();
    });
  });

  describe('command menu', () => {
    it('renders / command menu button', async () => {
      await renderWithProviders();
      expect(screen.getByTitle('Show command menu (/)')).toBeInTheDocument();
    });

    it('shows slash commands in menu', async () => {
      await renderWithProviders({ initOpts: { slashCommands: ['compact', 'cost'] } });
      await userEvent.click(screen.getByTitle('Show command menu (/)'));
      expect(screen.getByText('/compact')).toBeInTheDocument();
      expect(screen.getByText('/cost')).toBeInTheDocument();
    });
  });

  describe('context usage', () => {
    it('shows percentage when stats present', async () => {
      const { claude } = await renderWithProviders();
      // sendMessage → assistant → result (with stats from real fixture)
      await userEvent.click(screen.getByText('TriggerSend'));
      await claude.emit(s.assistant('done'));
      await claude.emit(s.result());
      expect(screen.queryByText(/% used/)).toBeInTheDocument();
    });

    it('does not render when stats is null', async () => {
      await renderWithProviders();
      expect(screen.queryByText(/% used/)).not.toBeInTheDocument();
    });

    it('uses contextUsage percentage when available', async () => {
      const { claude, user } = await renderWithWorkspace();

      claude.onControlRequest((req) => {
        if (req.subtype === 'get_context_usage') {
          return {
            categories: [],
            totalTokens: 50000,
            maxTokens: 200000,
            percentage: 25,
          };
        }
        return null;
      });

      // First get stats from result
      const textarea = screen.getByPlaceholderText(/Esc to focus/i);
      await user.click(textarea);
      await user.type(textarea, 'go');
      await user.keyboard('{Enter}');
      await claude.emit(s.assistant('done'));
      await claude.emit(s.result({ costUsd: 0.01, durationMs: 100 }));

      // Trigger settings:refresh_usage via UI — open /usage dialog
      await act(async () => {
        textarea.focus();
      });
      await user.type(textarea, '/usage');
      const usageItem = await screen.findByText(/Account & usage/i);
      await user.click(usageItem);
      // Wait for server pipeline: refresh_usage → get_context_usage → settings:usage
      await act(async () => {
        await new Promise((r) => setTimeout(r, 200));
      });

      // Should show contextUsage.percentage (25%) — toolbar + dialog both show it
      expect(screen.getAllByText(/25% used/).length).toBeGreaterThan(0);
    });
  });
});
