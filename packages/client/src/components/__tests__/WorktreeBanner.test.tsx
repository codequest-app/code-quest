import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
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
});
