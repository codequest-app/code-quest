import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ModelPickerPopover } from '../ModelPickerPopover';

// Include a 'default' entry so the sentinel button is suppressed — tests only deal with real models
const models = [
  { value: 'default', displayName: 'Default (recommended)' },
  { value: 'claude-opus-4-20250514', displayName: 'Claude Opus 4' },
  { value: 'claude-sonnet-4-20250514', displayName: 'Claude Sonnet 4' },
  { value: 'claude-haiku-4-5-20251001', displayName: 'Claude Haiku 4.5' },
];

function renderPanel(currentModel: string | null = null, onSwitch = vi.fn()) {
  render(
    <ModelPickerPopover currentModel={currentModel} availableModels={models} onSwitch={onSwitch} />,
  );
  return { onSwitch };
}

describe('ModelPickerPopover', () => {
  describe('active model highlighting', () => {
    it('highlights the currently selected model with bg-selected', () => {
      renderPanel('claude-sonnet-4-20250514');
      const activeBtn = screen.getByRole('option', { name: /Claude Sonnet 4/ });
      expect(activeBtn).toHaveAttribute('aria-selected', 'true');
    });

    it('does not highlight other models', () => {
      renderPanel('claude-sonnet-4-20250514');
      const opusBtn = screen.getByRole('option', { name: /Claude Opus 4/ });
      expect(opusBtn).toHaveAttribute('aria-selected', 'false');
    });
  });

  describe('ArrowDown / ArrowUp navigation', () => {
    it('ArrowDown moves active highlight to first item when none is selected', async () => {
      const user = userEvent.setup();
      renderPanel(null);
      const listbox = screen.getByRole('listbox');
      listbox.focus();

      await user.keyboard('{ArrowDown}');

      // buttons[0] = Default, buttons[1] = Opus, buttons[2] = Sonnet, buttons[3] = Haiku
      const buttons = screen.getAllByRole('option');
      expect(buttons[0].className).toContain('bg-selected');
    });

    it('ArrowDown moves to next item', async () => {
      const user = userEvent.setup();
      renderPanel('claude-opus-4-20250514'); // opus is index 1 in items[]
      const listbox = screen.getByRole('listbox');
      listbox.focus();

      await user.keyboard('{ArrowDown}'); // → index 2 = sonnet

      const buttons = screen.getAllByRole('option');
      expect(buttons[1].className).not.toContain('bg-selected'); // opus
      expect(buttons[2].className).toContain('bg-selected'); // sonnet
    });

    it('ArrowUp moves to previous item', async () => {
      const user = userEvent.setup();
      renderPanel('claude-sonnet-4-20250514'); // sonnet is index 2 in items[]
      const listbox = screen.getByRole('listbox');
      listbox.focus();

      await user.keyboard('{ArrowUp}'); // → index 1 = opus

      const buttons = screen.getAllByRole('option');
      expect(buttons[1].className).toContain('bg-selected'); // opus
      expect(buttons[2].className).not.toContain('bg-selected'); // sonnet
    });
  });

  describe('Enter selects focused item', () => {
    it('Enter selects the highlighted model', async () => {
      const user = userEvent.setup();
      const { onSwitch } = renderPanel('claude-opus-4-20250514');
      const listbox = screen.getByRole('listbox');
      listbox.focus();

      await user.keyboard('{ArrowDown}{Enter}');

      expect(onSwitch).toHaveBeenCalledWith('claude-sonnet-4-20250514');
    });
  });
});
