import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ModelPickerPopover } from '../ModelPickerPopover';

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
    it('highlights the currently selected model with aria-selected', () => {
      renderPanel('claude-sonnet-4-20250514');
      expect(screen.getByRole('option', { name: /Claude Sonnet 4/ })).toHaveAttribute(
        'aria-selected',
        'true',
      );
    });

    it('does not mark other models as selected', () => {
      renderPanel('claude-sonnet-4-20250514');
      expect(screen.getByRole('option', { name: /Claude Opus 4/ })).toHaveAttribute(
        'aria-selected',
        'false',
      );
    });
  });

  describe('ArrowDown / ArrowUp navigation', () => {
    it('ArrowDown focuses first option and applies bg-selected', async () => {
      const user = userEvent.setup();
      renderPanel(null);
      screen.getByRole('listbox').focus();

      await user.keyboard('{ArrowDown}');

      const buttons = screen.getAllByRole('option');
      expect(document.activeElement).toBe(buttons[0]);
      expect(buttons[0]!.className).toContain('bg-selected');
    });

    it('ArrowDown moves focus and bg-selected to next option', async () => {
      const user = userEvent.setup();
      renderPanel('claude-opus-4-20250514');
      screen.getByRole('listbox').focus();

      await user.keyboard('{ArrowDown}');

      const buttons = screen.getAllByRole('option');
      expect(document.activeElement).toBe(buttons[2]); // sonnet
      expect(buttons[2]!.className).toContain('bg-selected');
    });

    it('ArrowUp moves focus and bg-selected to previous option', async () => {
      const user = userEvent.setup();
      renderPanel('claude-sonnet-4-20250514');
      screen.getByRole('listbox').focus();

      await user.keyboard('{ArrowUp}');

      const buttons = screen.getAllByRole('option');
      expect(document.activeElement).toBe(buttons[1]); // opus
      expect(buttons[1]!.className).toContain('bg-selected');
    });

    it('ArrowDown does not go past last option', async () => {
      const user = userEvent.setup();
      renderPanel('claude-haiku-4-5-20251001');
      screen.getByRole('listbox').focus();

      await user.keyboard('{ArrowDown}{ArrowDown}');

      const buttons = screen.getAllByRole('option');
      expect(document.activeElement).toBe(buttons[3]);
    });

    it('ArrowUp does not go before first option', async () => {
      const user = userEvent.setup();
      renderPanel('default');
      screen.getByRole('listbox').focus();

      await user.keyboard('{ArrowUp}{ArrowUp}');

      const buttons = screen.getAllByRole('option');
      expect(document.activeElement).toBe(buttons[0]);
    });
  });

  describe('Enter selects focused item', () => {
    it('Enter selects the focused option', async () => {
      const user = userEvent.setup();
      const { onSwitch } = renderPanel('claude-opus-4-20250514');
      screen.getByRole('listbox').focus();

      await user.keyboard('{ArrowDown}{Enter}');

      expect(onSwitch).toHaveBeenCalledWith('claude-sonnet-4-20250514');
    });
  });
});
