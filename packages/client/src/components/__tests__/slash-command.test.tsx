import { segments as s } from '@code-quest/summoner/test';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import { describe, expect, it } from 'vitest';
import { renderWithChannel } from '../../test/render-with-channel';
import { ChatInputArea } from '../ChatInputArea';

async function renderChatInputArea(initOpts?: Parameters<typeof s.init>[1]) {
  return renderWithChannel(<ChatInputArea />, {
    initSegment: s.init('sess-1', initOpts),
    extraSegments: [s.controlResponse('init', { models: [{ value: 'claude-sonnet-4-20250514' }] })],
  });
}

async function renderChatInputAreaStrict(initOpts?: Parameters<typeof s.init>[1]) {
  return renderWithChannel(
    <StrictMode>
      <ChatInputArea />
    </StrictMode>,
    {
      initSegment: s.init('sess-1', initOpts),
      extraSegments: [
        s.controlResponse('init', { models: [{ value: 'claude-sonnet-4-20250514' }] }),
      ],
    },
  );
}

describe('slash command integration', () => {
  describe('typing / in textarea', () => {
    it('textarea retains focus after typing /scu', async () => {
      const user = userEvent.setup();
      await renderChatInputArea({ slashCommands: ['compact', 'cost', 'scu-template'] });
      const textarea = screen.getByRole('textbox');

      await user.type(textarea, '/scu');

      expect(textarea).toHaveFocus();
      expect(textarea).toHaveValue('/scu');
    });

    it('shows slash commands popup without filter input', async () => {
      const user = userEvent.setup();
      await renderChatInputArea({ slashCommands: ['compact'] });

      await user.type(screen.getByRole('textbox'), '/');

      expect(screen.getByText('Slash Commands')).toBeInTheDocument();
      expect(screen.queryByPlaceholderText('Filter actions...')).not.toBeInTheDocument();
    });

    it('filters slash commands as user types', async () => {
      const user = userEvent.setup();
      await renderChatInputArea({ slashCommands: ['compact', 'cost', 'scu-template'] });

      await user.type(screen.getByRole('textbox'), '/scu');

      expect(screen.getByText('/scu-template')).toBeInTheDocument();
      expect(screen.queryByText('/compact')).not.toBeInTheDocument();
      expect(screen.queryByText('/cost')).not.toBeInTheDocument();
    });

    it('shows "No matching commands" when no items match filter', async () => {
      const user = userEvent.setup();
      await renderChatInputArea({ slashCommands: ['compact'] });

      await user.type(screen.getByRole('textbox'), '/zzzzz');

      expect(screen.getByText('No matching commands')).toBeInTheDocument();
    });

    it('auto-highlights first matching slash command', async () => {
      const user = userEvent.setup();
      await renderChatInputArea({ slashCommands: ['compact', 'cost', 'scu-template'] });

      await user.type(screen.getByRole('textbox'), '/scu');

      const item = screen.getByText('/scu-template').closest('button');
      expect(item?.className).toContain('bg-selected');
    });
  });

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

  describe('Mention file from this project', () => {
    it('Click inserts @ into textarea, closes slash menu, and triggers mention search', async () => {
      const user = userEvent.setup();
      await renderChatInputArea({ slashCommands: [] });
      const textarea = screen.getByRole('textbox');

      await user.type(textarea, '/');
      await user.click(screen.getByRole('menuitem', { name: 'Mention file from this project...' }));

      expect(textarea).toHaveValue('@');
      expect(screen.queryByText('Slash Commands')).not.toBeInTheDocument();

      // After 200ms debounce, mention search should start (shows "Searching…")
      await waitFor(() => expect(screen.getByText('Searching…')).toBeInTheDocument(), {
        timeout: 1000,
      });
    });

    it('Tab selects it and inserts @ replacing the slash', async () => {
      const user = userEvent.setup();
      await renderChatInputArea({ slashCommands: [] });
      const textarea = screen.getByRole('textbox');

      await user.type(textarea, '/mention');
      const item = screen.getByRole('menuitem', { name: 'Mention file from this project...' });
      expect(item.className).toContain('bg-selected');

      await user.keyboard('{Tab}');

      expect(textarea).toHaveValue('@');
      expect(screen.queryByText('Slash Commands')).not.toBeInTheDocument();
    });

    it('Enter selects it and inserts @ replacing the slash', async () => {
      const user = userEvent.setup();
      await renderChatInputArea({ slashCommands: [] });
      const textarea = screen.getByRole('textbox');

      await user.type(textarea, '/mention');
      await user.keyboard('{Enter}');

      expect(textarea).toHaveValue('@');
      expect(screen.queryByText('Slash Commands')).not.toBeInTheDocument();
    });

    it('Tab in StrictMode does not produce @@', async () => {
      const user = userEvent.setup();
      await renderChatInputAreaStrict({ slashCommands: [] });
      const textarea = screen.getByRole('textbox');

      await user.type(textarea, '/mention');
      await user.keyboard('{Tab}');

      expect(textarea).toHaveValue('@');
    });
  });

  describe('click outside', () => {
    it('clicking outside keeps / in textarea', async () => {
      const user = userEvent.setup();
      await renderChatInputArea({ slashCommands: ['compact'] });
      const textarea = screen.getByRole('textbox');

      await user.type(textarea, '/');
      expect(screen.getByText('Slash Commands')).toBeInTheDocument();

      await user.click(document.body);
      expect(textarea).toHaveValue('/');
    });
  });

  describe('Escape key', () => {
    it('Escape closes command menu opened via / typing', async () => {
      const user = userEvent.setup();
      await renderChatInputArea({ slashCommands: ['compact'] });
      const textarea = screen.getByRole('textbox');

      await user.type(textarea, '/');
      expect(screen.getByText('Slash Commands')).toBeInTheDocument();

      await user.keyboard('{Escape}');
      expect(screen.queryByText('Slash Commands')).not.toBeInTheDocument();
    });

    it('Escape closes command menu opened via button click', async () => {
      const user = userEvent.setup();
      await renderChatInputArea({ slashCommands: ['compact'] });

      await user.click(screen.getByTitle('Show command menu (/)'));
      expect(screen.getByText('Slash Commands')).toBeInTheDocument();

      await user.keyboard('{Escape}');
      expect(screen.queryByText('Slash Commands')).not.toBeInTheDocument();
    });

    it('Escape restores focus to textarea after closing button-click menu', async () => {
      const user = userEvent.setup();
      await renderChatInputArea({ slashCommands: ['compact'] });
      const textarea = screen.getByRole('textbox');

      await user.click(screen.getByTitle('Show command menu (/)'));
      await user.keyboard('{Escape}');

      await waitFor(() => expect(textarea).toHaveFocus());
    });

    it('Escape closes mention dropdown opened via Mention file button (from button-click menu)', async () => {
      const user = userEvent.setup();
      await renderChatInputArea({ slashCommands: [] });

      await user.click(screen.getByTitle('Show command menu (/)'));
      await user.click(screen.getByRole('menuitem', { name: 'Mention file from this project...' }));

      await waitFor(() => expect(screen.getByTestId('mention-dropdown')).toBeInTheDocument());

      await user.keyboard('{Escape}');
      expect(screen.queryByTestId('mention-dropdown')).not.toBeInTheDocument();
    });

    it('Escape closes mention dropdown opened via Mention file button (from / menu)', async () => {
      const user = userEvent.setup();
      await renderChatInputArea({ slashCommands: [] });
      const textarea = screen.getByRole('textbox');

      await user.type(textarea, '/mention');
      await user.keyboard('{Enter}');

      await waitFor(() => expect(screen.getByTestId('mention-dropdown')).toBeInTheDocument());

      await user.keyboard('{Escape}');
      expect(screen.queryByTestId('mention-dropdown')).not.toBeInTheDocument();
    });

    it('single Escape closes / menu without leaving menu open', async () => {
      const user = userEvent.setup();
      await renderChatInputArea({ slashCommands: ['compact'] });
      const textarea = screen.getByRole('textbox');

      await user.type(textarea, '/');
      expect(screen.getByText('Slash Commands')).toBeInTheDocument();

      await user.keyboard('{Escape}');
      expect(screen.queryByText('Slash Commands')).not.toBeInTheDocument();
      expect(textarea).toHaveFocus();
    });

    it('Escape keeps / in textarea (does not clear input)', async () => {
      const user = userEvent.setup();
      await renderChatInputArea({ slashCommands: ['compact'] });
      const textarea = screen.getByRole('textbox');

      await user.type(textarea, '/');
      await user.keyboard('{Escape}');

      expect(textarea).toHaveValue('/');
    });

    it('Escape on / menu keeps textarea focused', async () => {
      const user = userEvent.setup();
      await renderChatInputArea({ slashCommands: ['compact'] });
      const textarea = screen.getByRole('textbox');

      await user.type(textarea, '/');
      await user.keyboard('{Escape}');

      expect(textarea).toHaveFocus();
    });
  });

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

  describe('section dividers', () => {
    it('no divider shown when only slash commands match the filter', async () => {
      const user = userEvent.setup();
      await renderChatInputArea({ slashCommands: ['code-review', 'claude-code-helper'] });

      await user.type(screen.getByRole('textbox'), '/code');

      expect(screen.getByText('Slash Commands')).toBeInTheDocument();
      // Slash Commands is the only visible section — no divider should precede it
      expect(document.querySelector('.h-px')).not.toBeInTheDocument();
    });
  });

  describe('clicking menu button', () => {
    it('shows filter input when opened via button click', async () => {
      const user = userEvent.setup();
      await renderChatInputArea({ slashCommands: ['compact'] });

      await user.click(screen.getByTitle('Show command menu (/)'));

      expect(screen.getByPlaceholderText('Filter actions...')).toBeInTheDocument();
    });

    it('shows all sections when opened via button click', async () => {
      const user = userEvent.setup();
      // /compact is registry-managed → not in CLI list; /cost and /scu-template are CLI-only
      await renderChatInputArea({ slashCommands: ['compact', 'cost', 'scu-template'] });

      await user.click(screen.getByTitle('Show command menu (/)'));

      expect(screen.getByText('Slash Commands')).toBeInTheDocument();
      expect(screen.queryByText('/compact')).not.toBeInTheDocument();
      expect(screen.getByText('/cost')).toBeInTheDocument();
      expect(screen.getByText('/scu-template')).toBeInTheDocument();
    });
  });
});
