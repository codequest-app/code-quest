import { segments as s } from '@code-quest/summoner/test';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PluginProvider } from '../../../contexts/PluginContext';
import { SessionProvider } from '../../../contexts/SessionContext';
import { SocketProvider } from '../../../contexts/SocketContext';
import { TabProvider } from '../../../contexts/TabContext';
import { createFakeClaude } from '../../../test/fake-claude';
import { renderWithWorkspace } from '../../../test/render-with-workspace';
import { ChannelProvider } from '../ChannelContext';
import { useChannelConfig } from '../index';

function ProviderConfigDisplay() {
  const { providerConfig } = useChannelConfig();
  if (!providerConfig) return <div data-testid="no-provider-config">none</div>;
  return <div data-testid="provider-brand">{providerConfig.brand.name}</div>;
}

describe('ChannelConfigContext', () => {
  it('providerConfig available on mount via get_provider_config', async () => {
    const claude = createFakeClaude();

    render(
      <SocketProvider socket={claude.socket}>
        <SessionProvider>
          <PluginProvider>
            <TabProvider>
              <ChannelProvider channelId="test-ch">
                <ProviderConfigDisplay />
              </ChannelProvider>
            </TabProvider>
          </PluginProvider>
        </SessionProvider>
      </SocketProvider>,
    );

    expect(await screen.findByTestId('provider-brand')).toHaveTextContent('Claude');
  });

  it('receives config from session:init on launch', async () => {
    const claude = createFakeClaude();
    claude.prepareInit(
      s.init('sess-1', {
        model: 'claude-sonnet-4-6',
        tools: ['Read', 'Write'],
        permissionMode: 'default',
        fastModeState: 'off',
        slashCommands: ['commit', 'review'],
        mcpServers: [{ name: 'github', status: 'connected' }],
      }),
    );
    await renderWithWorkspace({ claude });

    expect(screen.getByText('Ask before edits')).toBeInTheDocument();
  });

  it('updates config when CLI sends status with permissionMode', async () => {
    const { claude, user } = await renderWithWorkspace();
    const textarea = screen.getByPlaceholderText(/Esc to focus/i);
    await user.click(textarea);
    await user.type(textarea, 'go');
    await user.keyboard('{Enter}');
    await claude.emit(s.assistant('hi'));
    await claude.emit(s.result());

    await claude.emit(s.status({ permissionMode: 'plan' }));

    expect(screen.getByText('Plan mode')).toBeInTheDocument();
  });
});
