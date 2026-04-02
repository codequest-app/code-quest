import type {
  GitCheckoutResult,
  GitDiffResult,
  GitLogResult,
  GitStatusResult,
} from '@code-quest/shared';
import { createContext, type ReactNode, useContext, useMemo } from 'react';
import { rpc } from '../socket/rpc';
import { useWorkspaceFolder } from './channel';
import { useSocket } from './SocketContext';

export interface GitContextValue {
  gitStatus: () => Promise<GitStatusResult>;
  gitCheckout: (branch: string) => Promise<GitCheckoutResult>;
  gitLog: (limit?: number) => Promise<GitLogResult>;
  gitDiff: () => Promise<GitDiffResult>;
}

const GitContext = createContext<GitContextValue | null>(null);

export function useGit(): GitContextValue {
  const ctx = useContext(GitContext);
  if (!ctx) throw new Error('useGit must be used within a GitProvider');
  return ctx;
}

export function GitProvider({ children }: { children: ReactNode }) {
  const { socket } = useSocket();
  const workspaceFolder = useWorkspaceFolder();

  const value = useMemo<GitContextValue>(
    () => ({
      gitStatus: () => rpc(socket, 'git:status', { cwd: workspaceFolder }),
      gitCheckout: (branch) => rpc(socket, 'git:checkout', { branch, cwd: workspaceFolder }),
      gitLog: (limit) => rpc(socket, 'git:log', { limit, cwd: workspaceFolder }),
      gitDiff: () => rpc(socket, 'git:diff', { cwd: workspaceFolder }),
    }),
    [socket, workspaceFolder],
  );

  return <GitContext.Provider value={value}>{children}</GitContext.Provider>;
}
