import { beforeEach, describe, expect, it, vi } from 'vitest';
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

  it('addWorktreeAsync calls API and adds on success', async () => {
    const api = vi.fn().mockResolvedValue(undefined);
    await useWorktreeStore.getState().addWorktreeAsync('feat', 'feat/x', api);
    expect(api).toHaveBeenCalledWith('create', 'feat', 'feat/x');
    expect(useWorktreeStore.getState().worktrees.length).toBe(2);
    expect(useWorktreeStore.getState().loading).toBe(false);
    expect(useWorktreeStore.getState().error).toBeNull();
  });

  it('addWorktreeAsync sets error on failure', async () => {
    const api = vi.fn().mockRejectedValue(new Error('Network error'));
    await useWorktreeStore.getState().addWorktreeAsync('feat', 'feat/x', api);
    expect(useWorktreeStore.getState().worktrees.length).toBe(1);
    expect(useWorktreeStore.getState().loading).toBe(false);
    expect(useWorktreeStore.getState().error).toBe('Network error');
  });

  it('removeWorktreeAsync calls API and removes on success', async () => {
    useWorktreeStore.getState().addWorktree('temp', 'temp-branch');
    const api = vi.fn().mockResolvedValue(undefined);
    await useWorktreeStore.getState().removeWorktreeAsync('temp', api);
    expect(api).toHaveBeenCalledWith('remove', 'temp');
    expect(useWorktreeStore.getState().worktrees.length).toBe(1);
  });

  it('removeWorktreeAsync sets error on failure', async () => {
    useWorktreeStore.getState().addWorktree('temp', 'temp-branch');
    const api = vi.fn().mockRejectedValue(new Error('Server error'));
    await useWorktreeStore.getState().removeWorktreeAsync('temp', api);
    expect(useWorktreeStore.getState().worktrees.length).toBe(2); // not removed
    expect(useWorktreeStore.getState().error).toBe('Server error');
  });
});
