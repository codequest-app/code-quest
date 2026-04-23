import type {
  WorktreeAddedEvent,
  WorktreeBranchChangedEvent,
  WorktreeInfo,
  WorktreeRemovedEvent,
} from '@code-quest/shared';
import { EVENTS } from '@code-quest/shared';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import { rpc } from '../socket/rpc';
import { useSocket } from './SocketContext';

/** Sentinel stored in `listing` when the project is not a git repo.
 *  Distinguishes "not a repo" from "repo with zero worktrees" and from
 *  "not yet fetched" (undefined). */
export const NOT_A_REPO = 'not_a_repo' as const;
export type WorktreeListingEntry = WorktreeInfo[] | typeof NOT_A_REPO;

interface WorktreeState {
  listing: Record<string, WorktreeListingEntry>;
}

export type CreateWorktreeResult = { channelId: string; worktreePath: string };
export type ListResult = WorktreeInfo[] | { error: 'not_a_repo' | string };

export type InitRepoResult = { ok: true; branch: string } | { ok: false; error: string };

/** Create-worktree options mirroring server CreateWorktreePayload.
 *  One of `existingBranch` / `newBranch` / `name` decides the mode. */
export interface CreateWorktreeArgs {
  cwd: string;
  name?: string;
  existingBranch?: string;
  newBranch?: string;
  baseBranch?: string;
  path?: string;
}

export type CheckoutResult = { ok: true; branch: string } | { ok: false; error: string };

interface WorktreeActions {
  /** Create a worktree. Legacy signature `(cwd, name)` kept as convenience —
   *  pass an options object for Tab A/Tab B flows from CreateWorktreeDialog. */
  create: (
    cwdOrArgs: string | CreateWorktreeArgs,
    name?: string,
  ) => Promise<CreateWorktreeResult | { error: string }>;
  list: (cwd: string) => Promise<ListResult>;
  remove: (cwd: string, name: string) => Promise<boolean>;
  /** Initialize a non-git directory as a git repo. */
  initRepo: (cwd: string) => Promise<InitRepoResult>;
  /** Fetch branches for a repo (used by CreateWorktreeDialog Tab A dropdown). */
  listBranches: (cwd: string) => Promise<string[] | { error: string }>;
  /** Switch branch inside a worktree (git checkout). Broadcasts worktree:branchChanged. */
  checkout: (worktreeCwd: string, branch: string) => Promise<CheckoutResult>;
  /** Fetch git status (branch + changed-files count) for a worktree. */
  status: (
    worktreeCwd: string,
  ) => Promise<{ branch: string; isClean: boolean; changedFilesCount: number } | { error: string }>;
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
  const [listing, setListing] = useState<Record<string, WorktreeListingEntry>>({});

  const [actions] = useState<WorktreeActions>(() => ({
    async create(cwdOrArgs, name) {
      const payload: CreateWorktreeArgs =
        typeof cwdOrArgs === 'string' ? { cwd: cwdOrArgs, name } : cwdOrArgs;
      const res = await rpc(socket, EVENTS.worktree.create, payload);
      return res.ok ? res.data : { error: res.error };
    },
    async list(cwd) {
      const res = await rpc(socket, EVENTS.worktree.list, { cwd });
      if (!res.ok) {
        if (res.error === 'not_a_repo') {
          setListing((prev) => ({ ...prev, [cwd]: NOT_A_REPO }));
        }
        return { error: res.error };
      }
      setListing((prev) => ({ ...prev, [cwd]: res.data.worktrees }));
      return res.data.worktrees;
    },
    async remove(cwd, name) {
      const res = await rpc(socket, EVENTS.worktree.delete, { cwd, name });
      if (res.ok) {
        setListing((prev) => {
          const next = { ...prev };
          const entry = next[cwd];
          if (Array.isArray(entry)) next[cwd] = entry.filter((w) => w.name !== name);
          return next;
        });
      }
      return res.ok;
    },
    async initRepo(cwd) {
      const res = await rpc(socket, EVENTS.worktree.initRepo, { cwd });
      if (!res.ok) return { ok: false, error: res.error };
      // Listing patch comes via worktree:added broadcast; no local mutation.
      return { ok: true, branch: res.data.branch };
    },
    async listBranches(cwd) {
      const res = await rpc(socket, EVENTS.worktree.listBranches, { cwd });
      return res.ok ? res.data.branches : { error: res.error };
    },
    async checkout(worktreeCwd, branch) {
      const res = await rpc(socket, EVENTS.worktree.checkout, { cwd: worktreeCwd, branch });
      if (!res.ok) return { ok: false, error: res.error };
      return { ok: true, branch: res.data.branch };
    },
    async status(worktreeCwd) {
      const res = await rpc(socket, EVENTS.worktree.status, { cwd: worktreeCwd });
      return res.ok ? res.data : { error: res.error };
    },
  }));

  // Subscribe to server broadcasts. We only PATCH cache entries that already
  // exist (the project was fetched via list()). If a project has never been
  // fetched, ignore — avoids populating stale data for projects the user
  // never opened. Same pattern as projects:added/removed.
  useEffect(() => {
    if (!socket) return;
    const onAdded = (event: WorktreeAddedEvent) => {
      setListing((prev) => {
        const entry = prev[event.projectCwd];
        if (entry === undefined) return prev;
        const nextList: WorktreeInfo[] = Array.isArray(entry) ? [...entry] : [];
        if (nextList.some((w) => w.name === event.worktree.name)) return prev;
        nextList.push(event.worktree);
        return { ...prev, [event.projectCwd]: nextList };
      });
    };
    const onRemoved = (event: WorktreeRemovedEvent) => {
      setListing((prev) => {
        const entry = prev[event.projectCwd];
        if (!Array.isArray(entry)) return prev;
        return { ...prev, [event.projectCwd]: entry.filter((w) => w.name !== event.name) };
      });
    };
    const onBranchChanged = (event: WorktreeBranchChangedEvent) => {
      setListing((prev) => {
        const entry = prev[event.projectCwd];
        if (!Array.isArray(entry)) return prev;
        return {
          ...prev,
          [event.projectCwd]: entry.map((w) =>
            w.path === event.worktreePath ? { ...w, branch: event.branch } : w,
          ),
        };
      });
    };

    socket.on(EVENTS.worktree.added, onAdded);
    socket.on(EVENTS.worktree.removed, onRemoved);
    socket.on(EVENTS.worktree.branchChanged, onBranchChanged);
    return () => {
      socket.off(EVENTS.worktree.added, onAdded);
      socket.off(EVENTS.worktree.removed, onRemoved);
      socket.off(EVENTS.worktree.branchChanged, onBranchChanged);
    };
  }, [socket]);

  const state: WorktreeState = { listing };
  return (
    <WorktreeStateContext.Provider value={state}>
      <WorktreeActionsContext.Provider value={actions}>{children}</WorktreeActionsContext.Provider>
    </WorktreeStateContext.Provider>
  );
}
