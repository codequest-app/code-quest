import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { WorktreeBanner } from '../WorktreeBanner';

describe('WorktreeBanner', () => {
  it('renders worktree name', () => {
    render(
      <WorktreeBanner
        worktree={{ name: 'my-feature', path: '/repo/.claude/worktrees/my-feature' }}
      />,
    );
    expect(screen.getByTestId('worktree-banner')).toBeInTheDocument();
    expect(screen.getByText('my-feature')).toBeInTheDocument();
  });

  it('shows "Open in new tab" button', () => {
    render(
      <WorktreeBanner
        worktree={{ name: 'my-feature', path: '/repo/.claude/worktrees/my-feature' }}
      />,
    );
    expect(screen.getByRole('button', { name: /open.*tab/i })).toBeInTheDocument();
  });

  it('calls onOpenInNewTab when button clicked', async () => {
    const onOpenInNewTab = vi.fn();
    const user = userEvent.setup();
    render(
      <WorktreeBanner
        worktree={{ name: 'my-feature', path: '/repo/.claude/worktrees/my-feature' }}
        onOpenInNewTab={onOpenInNewTab}
      />,
    );
    await user.click(screen.getByRole('button', { name: /open.*tab/i }));
    expect(onOpenInNewTab).toHaveBeenCalledWith('/repo/.claude/worktrees/my-feature');
  });

  it('shows "This session is in worktree" text', () => {
    render(
      <WorktreeBanner
        worktree={{ name: 'my-feature', path: '/repo/.claude/worktrees/my-feature' }}
      />,
    );
    expect(screen.getByText(/in worktree/i)).toBeInTheDocument();
  });
});
