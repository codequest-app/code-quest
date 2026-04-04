import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithChannel } from '../../test/render-with-channel';
import { WorktreeBanner } from '../WorktreeBanner';

describe('WorktreeBanner', () => {
  it('renders worktree name', async () => {
    await renderWithChannel(
      <WorktreeBanner
        worktree={{ name: 'my-feature', path: '/repo/.claude/worktrees/my-feature' }}
      />,
    );
    expect(screen.getByTestId('worktree-banner')).toBeInTheDocument();
    expect(screen.getByText('my-feature')).toBeInTheDocument();
  });

  it('shows "Open in new tab" button', async () => {
    await renderWithChannel(
      <WorktreeBanner
        worktree={{ name: 'my-feature', path: '/repo/.claude/worktrees/my-feature' }}
      />,
    );
    expect(screen.getByRole('button', { name: /open.*tab/i })).toBeInTheDocument();
  });

  it('calls openWorktree from context when button clicked', async () => {
    const onWorktree = vi.fn();
    const user = userEvent.setup();
    await renderWithChannel(
      <WorktreeBanner
        worktree={{ name: 'my-feature', path: '/repo/.claude/worktrees/my-feature' }}
      />,
      { onWorktree },
    );
    await user.click(screen.getByRole('button', { name: /open.*tab/i }));
    expect(onWorktree).toHaveBeenCalledWith({
      name: 'my-feature',
      path: '/repo/.claude/worktrees/my-feature',
    });
  });

  it('shows "This session is in worktree" text', async () => {
    await renderWithChannel(
      <WorktreeBanner
        worktree={{ name: 'my-feature', path: '/repo/.claude/worktrees/my-feature' }}
      />,
    );
    expect(screen.getByText(/in worktree/i)).toBeInTheDocument();
  });
});
