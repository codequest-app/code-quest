import { segments as s } from '@code-quest/summoner/test';
import { screen } from '@testing-library/react';
import type userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { FakeClaude } from '../../test/fake-claude';
import { renderWithWorkspace } from '../../test/render-with-workspace';

type User = ReturnType<typeof userEvent.setup>;

async function sendMessage(claude: FakeClaude, user: User, text: string) {
  const textarea = screen.getByPlaceholderText(/Esc to focus/i);
  await user.click(textarea);
  await user.type(textarea, text);
  await user.keyboard('{Enter}');
  await claude.emit(s.assistant(`Reply to: ${text}`));
  await claude.emit(s.result());
}

async function openRewindDialog(user: User) {
  const textarea = screen.getByPlaceholderText(/Esc to focus/i);
  await user.click(textarea);
  await user.type(textarea, '/rewind');
  const rewindItem = await screen.findByText('Rewind');
  await user.click(rewindItem);
}

describe('RewindDialog', () => {
  it('opens from Command Menu and shows user messages', async () => {
    const { claude, user } = await renderWithWorkspace();
    await sendMessage(claude, user, 'First question');
    await sendMessage(claude, user, 'Second question');

    await openRewindDialog(user);

    const dialog = await screen.findByRole('dialog', { name: /rewind/i });
    expect(dialog).toBeInTheDocument();

    const items = screen.getAllByRole('option');
    expect(items).toHaveLength(2);
    // Most recent first
    expect(items[0]).toHaveTextContent('Second question');
    expect(items[1]).toHaveTextContent('First question');
  });

  it('shows empty state when no messages', async () => {
    const { user } = await renderWithWorkspace();

    await openRewindDialog(user);

    expect(await screen.findByText(/no messages to rewind/i)).toBeInTheDocument();
  });

  it('closes with Escape', async () => {
    const { claude, user } = await renderWithWorkspace();
    await sendMessage(claude, user, 'hello');

    await openRewindDialog(user);
    await screen.findByRole('dialog', { name: /rewind/i });

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog', { name: /rewind/i })).not.toBeInTheDocument();
  });
});
