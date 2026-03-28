import { segments as s } from '@code-quest/summoner/test';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ChannelProvider } from '../../contexts/channel';
import { PluginProvider } from '../../contexts/PluginContext';
import { SessionProvider } from '../../contexts/SessionContext';
import { SocketProvider } from '../../contexts/SocketContext';
import { TabProvider } from '../../contexts/TabContext';
import { createFakeClaude } from '../../test/fake-claude';
import { CommandMenu } from '../CommandMenu';

async function renderWithProviders(
  props: Partial<React.ComponentProps<typeof CommandMenu>> = {},
  initOpts?: Parameters<typeof s.init>[1],
) {
  const claude = createFakeClaude();
  const channelId = crypto.randomUUID();
  const result = render(
    <SocketProvider socket={claude.socket}>
      <SessionProvider>
        <PluginProvider>
          <TabProvider>
            <ChannelProvider channelId={channelId}>
              <CommandMenu {...props} />
            </ChannelProvider>
          </TabProvider>
        </PluginProvider>
      </SessionProvider>
    </SocketProvider>,
  );
  await act(async () => {
    await claude.initialize(
      s.init('sess-1', initOpts),
      s.controlResponse('init', {
        models: [{ value: 'claude-sonnet-4-6', displayName: 'Sonnet 4.6' }],
      }),
      { launch: { channelId } },
    );
  });
  return { claude, channelId, ...result };
}

describe('CommandMenu', () => {
  it('renders / command menu button', async () => {
    await renderWithProviders();
    expect(screen.getByTitle('Show command menu (/)')).toBeInTheDocument();
  });

  it('reads slashCommands from context and shows them in menu', async () => {
    await renderWithProviders({}, { slashCommands: ['compact', 'cost'] });
    await userEvent.click(screen.getByTitle('Show command menu (/)'));
    expect(screen.getByText('/compact')).toBeInTheDocument();
    expect(screen.getByText('/cost')).toBeInTheDocument();
  });

  it('reads effort from context and shows Effort item', async () => {
    await renderWithProviders();
    await userEvent.click(screen.getByTitle('Show command menu (/)'));
    expect(screen.getByText('Effort')).toBeInTheDocument();
  });

  it('calls onOpenModelPicker prop when Switch model clicked', async () => {
    const onOpenModelPicker = vi.fn();
    await renderWithProviders({ onOpenModelPicker });
    await userEvent.click(screen.getByTitle('Show command menu (/)'));
    await userEvent.click(screen.getByText('Switch model'));
    expect(onOpenModelPicker).toHaveBeenCalled();
  });

  it('only accepts dialog callback props — no modelLabel/effort/slashCommands props', async () => {
    await renderWithProviders({}, { slashCommands: ['test'] });
    // No error — context provides the data
  });
});
