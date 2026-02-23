import { beforeEach, describe, expect, it } from 'vitest';
import { useWorktreeStore } from '../worktreeStore';

describe('worktreeStore', () => {
  beforeEach(() => {
    useWorktreeStore.setState({
      worktrees: [{ name: 'main', branch: 'main', status: 'stable' }],
      loading: false,
      error: null,
    });
  });

  it('has default main worktree', () => {
    const { worktrees } = useWorktreeStore.getState();
    expect(worktrees.length).toBe(1);
    expect(worktrees[0].name).toBe('main');
  });

  it('addWorktree adds a new worktree', () => {
    useWorktreeStore.getState().addWorktree('feature-auth', 'feature/auth');
    const { worktrees } = useWorktreeStore.getState();
    expect(worktrees.length).toBe(2);
    expect(worktrees[1].name).toBe('feature-auth');
    expect(worktrees[1].branch).toBe('feature/auth');
    expect(worktrees[1].status).toBe('active');
  });

  it('removeWorktree removes by name', () => {
    useWorktreeStore.getState().addWorktree('temp', 'temp-branch');
    useWorktreeStore.getState().removeWorktree('temp');
    expect(useWorktreeStore.getState().worktrees.length).toBe(1);
  });

  it('removeWorktree does not remove main', () => {
    useWorktreeStore.getState().removeWorktree('main');
    expect(useWorktreeStore.getState().worktrees.length).toBe(1);
  });
});
