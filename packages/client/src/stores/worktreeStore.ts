import { create } from 'zustand';

export interface WorktreeEntry {
  name: string;
  branch: string;
  status: 'stable' | 'active' | 'idle';
}

export type WorktreeApiCallback = (
  action: 'create' | 'remove',
  name: string,
  branch?: string,
) => Promise<void>;

interface WorktreeStore {
  worktrees: WorktreeEntry[];
  loading: boolean;
  error: string | null;
  addWorktree: (name: string, branch: string) => void;
  removeWorktree: (name: string) => void;
  addWorktreeAsync: (name: string, branch: string, api: WorktreeApiCallback) => Promise<void>;
  removeWorktreeAsync: (name: string, api: WorktreeApiCallback) => Promise<void>;
}

export const useWorktreeStore = create<WorktreeStore>((set, get) => ({
  worktrees: [{ name: 'main', branch: 'main', status: 'stable' }],
  loading: false,
  error: null,

  addWorktree: (name: string, branch: string) => {
    set((state) => ({
      worktrees: [...state.worktrees, { name, branch, status: 'active' }],
    }));
  },

  removeWorktree: (name: string) => {
    if (name === 'main') return;
    set((state) => ({
      worktrees: state.worktrees.filter((w) => w.name !== name),
    }));
  },

  addWorktreeAsync: async (name: string, branch: string, api: WorktreeApiCallback) => {
    set({ loading: true, error: null });
    try {
      await api('create', name, branch);
      get().addWorktree(name, branch);
      set({ loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to create worktree',
      });
    }
  },

  removeWorktreeAsync: async (name: string, api: WorktreeApiCallback) => {
    if (name === 'main') return;
    set({ loading: true, error: null });
    try {
      await api('remove', name);
      get().removeWorktree(name);
      set({ loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to remove worktree',
      });
    }
  },
}));
