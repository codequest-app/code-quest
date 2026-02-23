import { create } from 'zustand';

export interface WorktreeEntry {
  name: string;
  branch: string;
  status: 'stable' | 'active' | 'idle';
}

interface WorktreeStore {
  worktrees: WorktreeEntry[];
  loading: boolean;
  error: string | null;
  addWorktree: (name: string, branch: string) => void;
  removeWorktree: (name: string) => void;
}

export const useWorktreeStore = create<WorktreeStore>((set) => ({
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
}));
