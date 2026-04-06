import type {
  GitDiffResult,
  GitLogResult,
  GitStatusResult,
  SuccessResponse,
} from '@code-quest/shared';
import {
  createContext,
  type ReactNode,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { rpc } from '../socket/rpc';
import { useSocket } from './SocketContext';

export interface GitContextValue {
  gitStatus: () => Promise<GitStatusResult>;
  gitCheckout: (branch: string) => Promise<SuccessResponse>;
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

  const socketRef = useRef(socket);
  useLayoutEffect(() => {
    socketRef.current = socket;
  });

  const [value] = useState<GitContextValue>(() => ({
    gitStatus: () => rpc(socketRef.current, 'git:status', {}),
    gitCheckout: (branch) => rpc(socketRef.current, 'git:checkout', { branch }),
    gitLog: (limit) => rpc(socketRef.current, 'git:log', { limit }),
    gitDiff: () => rpc(socketRef.current, 'git:diff', {}),
  }));

  return <GitContext.Provider value={value}>{children}</GitContext.Provider>;
}
