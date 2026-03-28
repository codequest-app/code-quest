import { segments as s } from '@code-quest/summoner/test';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ChannelProvider } from '../../contexts/channel';
import { PluginProvider } from '../../contexts/PluginContext';
import { SessionProvider } from '../../contexts/SessionContext';
import { SocketProvider } from '../../contexts/SocketContext';
import { TabProvider } from '../../contexts/TabContext';
import { createFakeClaude } from '../../test/fake-claude';
import { HeaderBar } from '../HeaderBar';

async function renderWithProviders(props: Partial<React.ComponentProps<typeof HeaderBar>> = {}) {
  const claude = createFakeClaude();
  const channelId = crypto.randomUUID();
  const result = render(
    <SocketProvider socket={claude.socket}>
      <SessionProvider>
        <PluginProvider>
          <TabProvider>
            <ChannelProvider channelId={channelId}>
              <HeaderBar {...props} />
            </ChannelProvider>
          </TabProvider>
        </PluginProvider>
      </SessionProvider>
    </SocketProvider>,
  );
  // Launch after mount — matches production flow (listeners registered before session:init arrives)
  await act(async () => {
    await claude.initialize(
      s.init('sess-1', { model: 'claude-sonnet-4-6' }),
      s.controlResponse('init', {
        models: [{ value: 'claude-sonnet-4-6', displayName: 'Sonnet 4.6' }],
      }),
      { launch: { channelId } },
    );
  });
  return { claude, channelId, ...result };
}

describe('HeaderBar (context mode)', () => {
  it('reads status from context — shows Connected when idle', async () => {
    await renderWithProviders();
    expect(screen.getByText(/connected/i)).toBeInTheDocument();
    expect(screen.getByText('Sonnet 4.6')).toBeInTheDocument();
  });

  it('reads status from context — shows Disconnected', async () => {
    const { claude } = await renderWithProviders();
    await act(async () => {
      claude.socket.disconnect();
    });
    expect(screen.getByText(/disconnected/i)).toBeInTheDocument();
  });

  it('reads kill from context — shows kill button', async () => {
    await renderWithProviders();
    expect(screen.getByTitle('Kill Session')).toBeInTheDocument();
  });

  it('title prop still works', async () => {
    await renderWithProviders({ title: 'Fix bug' });
    expect(screen.getByText('Fix bug')).toBeInTheDocument();
  });

  it('shows truncated channelId when no title', async () => {
    const { channelId } = await renderWithProviders();
    expect(screen.getByText(`${channelId.slice(0, 8)}…`)).toBeInTheDocument();
  });

  it('onToggleRaw prop shows Raw button', async () => {
    await renderWithProviders({ onToggleRaw: () => {} });
    expect(screen.getByTitle('Raw Events')).toBeInTheDocument();
  });

  it('kill confirm flow works via context', async () => {
    const user = userEvent.setup();
    await renderWithProviders();
    await user.click(screen.getByTitle('Kill Session'));
    expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.getByTitle('Kill Session')).toBeInTheDocument();
  });
});
