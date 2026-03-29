import { segments as s } from '@code-quest/summoner/test';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ChannelProvider, useChannelMessages } from '../../contexts/channel';
import { PluginProvider } from '../../contexts/PluginContext';
import { SessionProvider } from '../../contexts/SessionContext';
import { SocketProvider } from '../../contexts/SocketContext';
import { TabProvider } from '../../contexts/TabContext';
import { createFakeClaude } from '../../test/fake-claude';
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

    it('updates context usage from server when usage dialog opens', async () => {
      const { claude } = await renderWithProviders();

      // Send a message so stats exist
      await userEvent.click(screen.getByText('TriggerSend'));
      await claude.emit(s.assistant('done'));
      await claude.emit(s.result({ costUsd: 0.01, durationMs: 100 }));

      // Server pushes context usage via state:usage
      await act(async () => {
        (claude.socket as any).serverSocket.emit('state:usage', {
          channelId: '',
          usage: {},
          contextUsage: { inputTokens: 80000, outputTokens: 5000, contextWindow: 200000 },
        });
      });

      // Context percentage should update (80000/200000 = 40%)
      expect(await screen.findByText(/40% used/)).toBeInTheDocument();
    });
  });
});
