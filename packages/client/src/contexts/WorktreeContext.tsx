import type { WorktreeInfo } from '@code-quest/shared';
import { createContext, type ReactNode, useContext, useState } from 'react';
import { rpc } from '../socket/rpc';
import { useSocket } from './SocketContext';

interface WorktreeState {
  listing: Record<string, WorktreeInfo[]>;
}

export type CreateWorktreeResult = { channelId: string; worktreePath: string };

interface WorktreeActions {
  /** Returns result on success, or an error message string on failure. */
  create: (cwd: string, name: string) => Promise<CreateWorktreeResult | { error: string }>;
  list: (cwd: string) => Promise<WorktreeInfo[]>;
  remove: (cwd: string, name: string) => Promise<boolean>;
}

const WorktreeStateContext = createContext<WorktreeState | null>(null);
const WorktreeActionsContext = createContext<WorktreeActions | null>(null);

export function useWorktreeState(): WorktreeState {
  const ctx = useContext(WorktreeStateContext);
  if (!ctx) throw new Error('useWorktreeState must be used within WorktreeProvider');
  return ctx;
}

export function useWorktreeActions(): WorktreeActions {
  const ctx = useContext(WorktreeActionsContext);
  if (!ctx) throw new Error('useWorktreeActions must be used within WorktreeProvider');
  return ctx;
}

export function WorktreeProvider({ children }: { children: ReactNode }) {
  const { socket } = useSocket();
  const [listing, setListing] = useState<Record<string, WorktreeInfo[]>>({});

  const [actions] = useState<WorktreeActions>(() => ({
    async create(cwd, name) {
      const res = await rpc(socket, 'worktree:create', { cwd, name });
      return res.ok ? res.data : { error: res.error };
    },
    async list(cwd) {
      const res = await rpc(socket, 'worktree:list', { cwd });
      const worktrees = res.ok ? res.data.worktrees : [];
      setListing((prev) => ({ ...prev, [cwd]: worktrees }));
      return worktrees;
    },
    async remove(cwd, name) {
      const res = await rpc(socket, 'worktree:delete', { cwd, name });
      if (res.ok) {
        setListing((prev) => {
          const next = { ...prev };
          if (next[cwd]) next[cwd] = next[cwd].filter((w) => w.name !== name);
          return next;
        });
      }
      return res.ok;
    },
  }));

  const state: WorktreeState = { listing };
  return (
    <WorktreeStateContext.Provider value={state}>
      <WorktreeActionsContext.Provider value={actions}>{children}</WorktreeActionsContext.Provider>
    </WorktreeStateContext.Provider>
  );
}
