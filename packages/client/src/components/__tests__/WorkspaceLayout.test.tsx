import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PluginProvider } from '../../contexts/PluginContext';
import { SessionProvider } from '../../contexts/SessionContext';
import { SocketProvider } from '../../contexts/SocketContext';
import type { TabMeta } from '../../contexts/TabContext';
import { TabProvider } from '../../contexts/TabContext';
import { usePreferencesStore } from '../../stores/usePreferencesStore';
import { createFakeClaude } from '../../test/fake-claude';
import { WorkspaceLayout } from '../WorkspaceLayout';

vi.mock('../../contexts/channel', () => ({
  ChannelProvider: ({ channelId, children }: { channelId?: string; children: React.ReactNode }) => (
    <div data-channel-id={channelId ?? ''}>{children}</div>
  ),
}));

vi.mock('../ChatPanel', () => ({
  ChatPanel: () => <div data-testid="chat-panel" />,
}));

function renderLayout(opts?: { tabs?: Record<string, TabMeta>; activeTabId?: string | null }) {
  const { socket } = createFakeClaude();
  const initialState = opts
    ? { tabs: opts.tabs ?? {}, activeTabId: opts.activeTabId ?? null }
    : undefined;
  return render(
    <SocketProvider socket={socket}>
      <SessionProvider>
        <PluginProvider>
          <TabProvider initialState={initialState}>
            <WorkspaceLayout />
          </TabProvider>
        </PluginProvider>
      </SessionProvider>
    </SocketProvider>,
  );
}

describe('WorkspaceLayout', () => {
  beforeEach(() => {
    usePreferencesStore.setState({ isOnboardingDismissed: true });
  });

  it('renders a ChannelProvider per tab with ChatPanel inside', () => {
    renderLayout({
      tabs: { 'sess-a': { tabStatus: 'default' } },
      activeTabId: 'sess-a',
    });

    const panel = screen.getByTestId('chat-panel');
    expect(panel.parentElement).toHaveAttribute('data-channel-id', 'sess-a');
  });

  it('renders one ChannelProvider per tab with CSS show/hide', () => {
    renderLayout({
      tabs: {
        'sess-a': { tabStatus: 'default' },
        'sess-b': { tabStatus: 'default' },
      },
      activeTabId: 'sess-a',
    });

    const providers = screen.getAllByTestId('chat-panel');
    expect(providers).toHaveLength(2);

    const sessA = providers.find(
      (el) => el.parentElement?.getAttribute('data-channel-id') === 'sess-a',
    );
    const sessB = providers.find(
      (el) => el.parentElement?.getAttribute('data-channel-id') === 'sess-b',
    );
    expect(sessA?.closest('[data-channel-id]')?.parentElement).not.toHaveClass('hidden');
    expect(sessB?.closest('[data-channel-id]')?.parentElement).toHaveClass('hidden');
  });

  it('renders no panels when there are no tabs', () => {
    renderLayout();

    expect(screen.queryByTestId('chat-panel')).not.toBeInTheDocument();
  });

  it('renders TabBar above workspace panels', () => {
    renderLayout({
      tabs: { 'sess-a': { tabStatus: 'default' } },
      activeTabId: 'sess-a',
    });

    expect(screen.getByTestId('tab-bar')).toBeInTheDocument();
  });

  it('close tab removes tab from UI', async () => {
    renderLayout({
      tabs: {
        'sess-a': { tabStatus: 'default' },
        'sess-b': { tabStatus: 'default' },
      },
      activeTabId: 'sess-a',
    });

    await userEvent.click(screen.getByLabelText('Close sess-b'));
    await userEvent.click(screen.getByRole('button', { name: /close/i }));

    expect(screen.queryByLabelText('Close sess-b')).not.toBeInTheDocument();
  });
});
