import { segments as s } from '@code-quest/summoner/test';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderWithChannel } from '../../test/render-with-channel';
import { ChatInputArea } from '../ChatInputArea';

async function renderChatInputArea(initOpts?: Parameters<typeof s.init>[1]) {
  return renderWithChannel(<ChatInputArea />, {
    initSegment: s.init('sess-1', initOpts),
    extraSegments: [s.controlResponse('init', { models: [{ value: 'claude-sonnet-4-20250514' }] })],
  });
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

  describe('clicking menu button', () => {
    it('shows filter input when opened via button click', async () => {
      const user = userEvent.setup();
      await renderChatInputArea({ slashCommands: ['compact'] });

      await user.click(screen.getByTitle('Show command menu (/)'));

      expect(screen.getByPlaceholderText('Filter actions...')).toBeInTheDocument();
    });

    it('shows all sections when opened via button click', async () => {
      const user = userEvent.setup();
      await renderChatInputArea({ slashCommands: ['compact', 'cost', 'scu-template'] });

      await user.click(screen.getByTitle('Show command menu (/)'));

      expect(screen.getByText('Slash Commands')).toBeInTheDocument();
      expect(screen.getByText('/compact')).toBeInTheDocument();
      expect(screen.getByText('/cost')).toBeInTheDocument();
      expect(screen.getByText('/scu-template')).toBeInTheDocument();
    });
  });
});
