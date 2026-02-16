import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WorktreeIndicator } from '../WorktreeIndicator';

describe('WorktreeIndicator', () => {
  it('renders worktree path', () => {
    render(<WorktreeIndicator path="/tmp/worktree-1" branch="feat/task-1" />);
    expect(screen.getByTestId('worktree-indicator')).toBeInTheDocument();
    expect(screen.getByText(/worktree-1/)).toBeInTheDocument();
  });

  it('shows branch name', () => {
    render(<WorktreeIndicator path="/tmp/wt" branch="feat/task-1" />);
    expect(screen.getByText(/feat\/task-1/)).toBeInTheDocument();
  });

  it('shows worktree icon', () => {
    render(<WorktreeIndicator path="/tmp/wt" branch="main" />);
    expect(screen.getByTestId('worktree-indicator')).toHaveTextContent('🌳');
  });

  it('does not render when path is empty', () => {
    const { container } = render(<WorktreeIndicator path="" branch="" />);
    expect(container.innerHTML).toBe('');
  });
});
