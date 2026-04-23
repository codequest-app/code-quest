import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RenameProjectDialog } from '../RenameProjectDialog';

describe('RenameProjectDialog', () => {
  it('pre-fills input with current name', () => {
    render(
      <RenameProjectDialog open currentName="cc-office" onRename={() => {}} onClose={() => {}} />,
    );
    const input = screen.getByRole('textbox', { name: /new name/i }) as HTMLInputElement;
    expect(input.value).toBe('cc-office');
  });

  it('Rename button disabled when input empty', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(
      <RenameProjectDialog open currentName="cc-office" onRename={() => {}} onClose={() => {}} />,
    );
    const input = screen.getByRole('textbox', { name: /new name/i });
    await user.clear(input);
    expect(screen.getByRole('button', { name: /^rename$/i })).toBeDisabled();
  });

  it('Rename button disabled when input unchanged', () => {
    render(
      <RenameProjectDialog open currentName="cc-office" onRename={() => {}} onClose={() => {}} />,
    );
    expect(screen.getByRole('button', { name: /^rename$/i })).toBeDisabled();
  });

  it('Submit calls onRename with new name + onClose', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onRename = vi.fn();
    const onClose = vi.fn();
    render(
      <RenameProjectDialog open currentName="cc-office" onRename={onRename} onClose={onClose} />,
    );
    const input = screen.getByRole('textbox', { name: /new name/i });
    await user.clear(input);
    await user.type(input, 'CC Office');
    await user.click(screen.getByRole('button', { name: /^rename$/i }));
    expect(onRename).toHaveBeenCalledWith('CC Office');
    expect(onClose).toHaveBeenCalled();
  });

  it('Cancel button calls onClose without onRename', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onRename = vi.fn();
    const onClose = vi.fn();
    render(
      <RenameProjectDialog open currentName="cc-office" onRename={onRename} onClose={onClose} />,
    );
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
    expect(onRename).not.toHaveBeenCalled();
  });

  it('Enter key submits when input is valid', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onRename = vi.fn();
    render(
      <RenameProjectDialog open currentName="cc-office" onRename={onRename} onClose={() => {}} />,
    );
    const input = screen.getByRole('textbox', { name: /new name/i });
    await user.clear(input);
    await user.type(input, 'New{Enter}');
    expect(onRename).toHaveBeenCalledWith('New');
  });
});
