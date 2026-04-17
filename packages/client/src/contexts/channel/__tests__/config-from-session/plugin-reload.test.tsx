import { segments as s } from '@code-quest/summoner/test';
import { act, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createFakeSummoner } from '@/test/fake-summoner';
import { renderWithChannel } from '@/test/render-with-channel';
import { useChannelConfig } from '../../index';

describe('reload plugins hot reload', () => {
  function ReloadDisplay() {
    const { slashCommands, mcpServers } = useChannelConfig();
    return (
      <div>
        <div data-testid="slash-commands">{slashCommands.join(',')}</div>
        <div data-testid="mcp-servers">{mcpServers.map((m) => m.name).join(',')}</div>
      </div>
    );
  }

  it('updates slashCommands and mcpServers when server pushes plugin:reloaded', async () => {
    const summoner = createFakeSummoner();
    const { claude, channelId } = await renderWithChannel(<ReloadDisplay />, {
      summoner,
      initSegment: s.init('sess-reload', {
        slashCommands: ['old-skill'],
        mcpServers: [{ name: 'old-server', status: 'connected' }],
      }),
    });

    expect(screen.getByTestId('slash-commands')).toHaveTextContent('old-skill');

    await act(async () => {
      claude.pushServerEvent('plugin:reloaded', {
        channelId,
        commands: [{ name: 'new-skill', description: 'A new skill', argumentHint: '' }],
        mcpServers: [{ name: 'new-server', status: 'connected' }],
      });
    });

    expect(screen.getByTestId('slash-commands')).toHaveTextContent('new-skill');
    expect(screen.getByTestId('mcp-servers')).toHaveTextContent('new-server');
  });
});
