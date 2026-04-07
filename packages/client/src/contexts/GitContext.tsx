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
import { channelRpc } from '../socket/rpc';
import { useChannelMessages } from './channel';
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
  const { channelId } = useChannelMessages();

  const socketRef = useRef(socket);
  const channelIdRef = useRef(channelId);
  useLayoutEffect(() => {
    socketRef.current = socket;
    channelIdRef.current = channelId;
  });

  const [value] = useState<GitContextValue>(() => ({
    gitStatus: () =>
      channelRpc<GitStatusResult>(socketRef.current, channelIdRef.current, 'git:status', {}),
    gitCheckout: (branch) =>
      channelRpc<SuccessResponse>(socketRef.current, channelIdRef.current, 'git:checkout', {
        branch,
      }),
    gitLog: (limit) =>
      channelRpc<GitLogResult>(socketRef.current, channelIdRef.current, 'git:log', { limit }),
    gitDiff: () =>
      channelRpc<GitDiffResult>(socketRef.current, channelIdRef.current, 'git:diff', {}),
  }));

  return <GitContext.Provider value={value}>{children}</GitContext.Provider>;
}
