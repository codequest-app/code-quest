import type { WorktreeInfo } from '@code-quest/shared';
import { createContext, type ReactNode, useContext, useRef } from 'react';
import type { ChannelInitialState } from '../../types/chat';
import { GitProvider } from '../GitContext';
import { ChannelComposeProvider } from './ChannelComposeContext';
import { ChannelConfigProvider } from './ChannelConfigContext';
import { ChannelControlProvider } from './ChannelControlContext';
import { ChannelMessagesProvider } from './ChannelMessagesContext';

// ── Workspace folder context ──

const CwdContext = createContext<string>('../');

export function useCwd(): string {
  return useContext(CwdContext);
}

// ── ChannelProvider (orchestrator) ──

export function ChannelProvider({
  channelId,
  children,
  initialState,
  onTitleChange,
  onStatusChange,
  onWorktree,
  cwd = '../',
}: {
  channelId: string;
  children: ReactNode;
  initialState?: ChannelInitialState;
  onTitleChange?: (title: string) => void;
  onStatusChange?: (status: 'default' | 'pending' | 'done') => void;
  onWorktree?: (info: WorktreeInfo) => void;
  cwd?: string;
}) {
  const resetStreamingRefsRef = useRef(() => {});
  const messageQueueRef = useRef<string[]>([]);

  return (
    <CwdContext.Provider value={cwd}>
      <ChannelMessagesProvider
        channelId={channelId}
        initialState={initialState}
        onTitleChange={onTitleChange}
        onStatusChange={onStatusChange}
        dequeueMessage={() => messageQueueRef.current.shift()}
        messageQueueRef={messageQueueRef}
        resetStreamingRefsRef={resetStreamingRefsRef}
      >
        <ChannelControlProvider
          channelId={channelId}
          resetStreamingRefs={() => resetStreamingRefsRef.current()}
        >
          <ChannelConfigProvider
            channelId={channelId}
            initialConfig={initialState}
            onWorktree={onWorktree}
          >
            <ChannelComposeProvider channelId={channelId}>
              <GitProvider>{children}</GitProvider>
            </ChannelComposeProvider>
          </ChannelConfigProvider>
        </ChannelControlProvider>
      </ChannelMessagesProvider>
    </CwdContext.Provider>
  );
}
