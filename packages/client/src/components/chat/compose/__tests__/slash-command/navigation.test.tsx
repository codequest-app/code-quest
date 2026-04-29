import { segments as s } from '@code-quest/summoner/test';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderWithChannel } from '../../../../../test/render-with-channel';
import { ChatInputArea } from '../../ChatInputArea';

async function renderChatInputArea(initOpts?: Parameters<typeof s.init>[1]) {
  return renderWithChannel(<ChatInputArea />, {
    initSegment: s.init('sess-1', initOpts),
    extraSegments: [s.controlResponse('init', { models: [{ value: 'claude-sonnet-4-20250514' }] })],
  });
}

describe('slash command integration', () => {
  describe('Arrow key navigation', () => {
    it('ArrowDown from no selection highlights first item', async () => {
      const user = userEvent.setup();
      await renderChatInputArea({ slashCommands: ['compact'] });
      const textarea = screen.getByRole('textbox');

      // Type / with no filter — nothing is auto-highlighted
      await user.type(textarea, '/');
      const getHighlighted = () =>
        screen.queryAllByRole('menuitem').filter((b) => b.className.includes('bg-selected'));
      expect(getHighlighted()).toHaveLength(0);

      // ArrowDown should move to first item
      await user.keyboard('{ArrowDown}');
      expect(getHighlighted().length).toBeGreaterThan(0);
    });

    it('ArrowDown moves to next item', async () => {
      const user = userEvent.setup();
      await renderChatInputArea({ slashCommands: ['compact'] });
      const textarea = screen.getByRole('textbox');

      await user.type(textarea, '/');
      await user.keyboard('{ArrowDown}');
      const getHighlighted = () =>
        screen.queryAllByRole('menuitem').find((b) => b.className.includes('bg-selected')) ?? null;
      const first = getHighlighted();
      expect(first).not.toBeNull();

      await user.keyboard('{ArrowDown}');
      const second = getHighlighted();
      expect(second).not.toBeNull();
      expect(second).not.toBe(first);
    });
  });

  describe('Tab on highlighted item', () => {
    it('Tab on highlighted slash command autocompletes with space', async () => {
      const user = userEvent.setup();
      // /compact is registry-managed; use /cost (CLI-only) for autocomplete test
      await renderChatInputArea({ slashCommands: ['cost'] });
      const textarea = screen.getByRole('textbox');

      await user.type(textarea, '/cost');
      // /cost is auto-highlighted (only match)
      const item = screen.getByRole('menuitem', { name: '/cost' });
      expect(item?.className).toContain('bg-selected');

      await user.keyboard('{Tab}');

      // Autocomplete: textarea gets '/cost ' and menu closes
      expect(textarea).toHaveValue('/cost ');
      expect(screen.queryByText('Slash Commands')).not.toBeInTheDocument();
    });

    it('Tab on highlighted non-slash item executes it', async () => {
      const user = userEvent.setup();
      await renderChatInputArea({ slashCommands: ['compact'] });
      const textarea = screen.getByRole('textbox');

      await user.type(textarea, '/clear');
      // 'Clear conversation' should be highlighted (only match)
      const item = screen.getByText('Clear conversation').closest('button');
      expect(item?.className).toContain('bg-selected');

      await user.keyboard('{Tab}');

      // Non-slash item executed → menu closes, textarea cleared
      expect(screen.queryByText('Slash Commands')).not.toBeInTheDocument();
    });
  });
});
