import { segments as s } from '@code-quest/summoner/test';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderWithChannel } from '../../../test/render-with-channel';
import { ChatInputArea } from '../../ChatInputArea';

async function renderChatInputArea(initOpts?: Parameters<typeof s.init>[1]) {
  return renderWithChannel(<ChatInputArea />, {
    initSegment: s.init('sess-1', initOpts),
    extraSegments: [s.controlResponse('init', { models: [{ value: 'claude-sonnet-4-20250514' }] })],
  });
}

describe('slash command integration', () => {
  describe('Shift+Tab mode cycling', () => {
    it('cycles from normal to acceptEdits on Shift+Tab in textarea', async () => {
      const user = userEvent.setup();
      await renderChatInputArea({ permissionMode: 'normal' });

      expect(screen.getByText('Ask before edits')).toBeInTheDocument();

      const textarea = screen.getByRole('textbox');
      textarea.focus();
      await user.keyboard('{Shift>}{Tab}{/Shift}');

      // Optimistic update — no server round-trip needed
      expect(screen.getByText('Edit automatically')).toBeInTheDocument();
    });

    it('does not cycle when slash menu is open', async () => {
      const user = userEvent.setup();
      await renderChatInputArea({ permissionMode: 'normal', slashCommands: ['compact'] });

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, '/');
      expect(screen.getByText('Slash Commands')).toBeInTheDocument();

      await user.keyboard('{Shift>}{Tab}{/Shift}');

      // Mode should remain unchanged
      expect(screen.getByText('Ask before edits')).toBeInTheDocument();
    });
  });
});
