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
