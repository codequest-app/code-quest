import { createContext, type ReactNode, useContext, useRef } from 'react';
import type { ChannelInitialState } from '../../types/chat';
import { ChannelComposeProvider } from './ChannelComposeContext';
import { ChannelConfigProvider } from './ChannelConfigContext';
import { ChannelControlProvider } from './ChannelControlContext';
import { ChannelMessagesProvider } from './ChannelMessagesContext';

// ── Workspace folder context ──

const WorkspaceFolderContext = createContext<string>('../');

export function useWorkspaceFolder(): string {
  return useContext(WorkspaceFolderContext);
}

// ── ChannelProvider (orchestrator) ──

export function ChannelProvider({
  channelId,
  children,
  initialState,
  onTitleChange,
  onStatusChange,
  workspaceFolder = '../',
}: {
  channelId: string;
  children: ReactNode;
  initialState?: ChannelInitialState;
  onTitleChange?: (title: string) => void;
  onStatusChange?: (status: 'default' | 'pending' | 'done') => void;
  workspaceFolder?: string;
}) {
  const resetStreamingRefsRef = useRef(() => {});
  const messageQueueRef = useRef<string[]>([]);

  return (
    <WorkspaceFolderContext.Provider value={workspaceFolder}>
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
          initialPendingControls={initialState?.pendingControls}
          resetStreamingRefs={() => resetStreamingRefsRef.current()}
        >
          <ChannelConfigProvider channelId={channelId} initialConfig={initialState}>
            <ChannelComposeProvider>{children}</ChannelComposeProvider>
          </ChannelConfigProvider>
        </ChannelControlProvider>
      </ChannelMessagesProvider>
    </WorkspaceFolderContext.Provider>
  );
}
