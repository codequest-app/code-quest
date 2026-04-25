import type { WorktreeInfo } from '@code-quest/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { WorktreeRow } from '../WorktreeRow';

const baseWt: WorktreeInfo = {
  name: 'feat-x',
  path: '/repo/.claude/worktrees/feat-x',
  branch: 'worktree-feat-x',
};

function defaultProps() {
  return {
    worktree: baseWt,
    active: false,
    liveSessions: 0,
    changes: 0,
    onSelect: () => {},
    onBranchClick: () => {},
    onMoreActions: () => {},
  };
}

describe('WorktreeRow', () => {
  it('renders ⎇ glyph + branch label', () => {
    render(<WorktreeRow {...defaultProps()} />);
    const branch = screen.getByTestId('wt-branch');
    expect(branch.textContent).toContain('⎇');
    expect(branch.textContent).toContain('worktree-feat-x');
  });

  it('branch label is styled as a monospace badge with border + bg', () => {
    render(<WorktreeRow {...defaultProps()} />);
    const branch = screen.getByTestId('wt-branch');
    // F.html contract: branch is a distinct badge, not just subtle text.
    expect(branch.className).toMatch(/font-mono/);
    expect(branch.className).toMatch(/border/);
  });

  it('falls back to worktree name when branch missing', () => {
    render(<WorktreeRow {...defaultProps()} worktree={{ name: 'main', path: '/repo' }} />);
    expect(screen.getByTestId('wt-branch').textContent).toContain('main');
  });

  it('clicking branch triggers onBranchClick (not onSelect)', async () => {
    const onBranchClick = vi.fn();
    const onSelect = vi.fn();
    render(<WorktreeRow {...defaultProps()} onBranchClick={onBranchClick} onSelect={onSelect} />);
    await userEvent.setup({ pointerEventsCheck: 0 }).click(screen.getByTestId('wt-branch'));
    expect(onBranchClick).toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('clicking row body triggers onSelect (not onBranchClick)', async () => {
    const onSelect = vi.fn();
    const onBranchClick = vi.fn();
    render(<WorktreeRow {...defaultProps()} onSelect={onSelect} onBranchClick={onBranchClick} />);
    // Click the outer row (role=button name mentions "Open worktree")
    await userEvent
      .setup({ pointerEventsCheck: 0 })
      .click(screen.getByRole('button', { name: /open worktree worktree-feat-x/i }));
    expect(onSelect).toHaveBeenCalled();
    expect(onBranchClick).not.toHaveBeenCalled();
  });

  it('shows live pill with count when liveSessions > 0', () => {
    render(<WorktreeRow {...defaultProps()} liveSessions={2} />);
    expect(screen.getByLabelText(/2 active sessions/i)).toBeInTheDocument();
  });

  it('hides live pill when liveSessions = 0', () => {
    render(<WorktreeRow {...defaultProps()} liveSessions={0} />);
    expect(screen.queryByLabelText(/active session/i)).toBeNull();
  });

  it('shows orange changes dot when changes > 0', () => {
    render(<WorktreeRow {...defaultProps()} changes={3} />);
    const dot = screen.getByTestId('wt-changes-dot');
    expect(dot).toBeInTheDocument();
    expect(dot.getAttribute('title')).toMatch(/3 change/);
  });

  it('hides changes dot when changes = 0', () => {
    render(<WorktreeRow {...defaultProps()} changes={0} />);
    expect(screen.queryByTestId('wt-changes-dot')).toBeNull();
  });

  it('active state adds border-accent class', () => {
    const { container } = render(<WorktreeRow {...defaultProps()} active />);
    expect(container.firstElementChild?.className).toContain('border-accent');
  });

  it('⋯ button triggers onMoreActions, not onSelect', async () => {
    const onMoreActions = vi.fn();
    const onSelect = vi.fn();
    render(<WorktreeRow {...defaultProps()} onMoreActions={onMoreActions} onSelect={onSelect} />);
    await userEvent
      .setup({ pointerEventsCheck: 0 })
      .click(screen.getByRole('button', { name: /more actions/i }));
    expect(onMoreActions).toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
  });
});
