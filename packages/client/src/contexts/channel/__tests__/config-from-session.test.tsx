import { segments as s } from '@code-quest/summoner/test';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createFakeClaude } from '../../../test/fake-claude';
import { renderWithWorkspace } from '../../../test/render-with-workspace';

describe('ChannelConfigContext', () => {
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
