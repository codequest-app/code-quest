import { type ReactNode, useRef } from 'react';
import type { ChannelInitialState } from '../../types/chat';
import { ChannelComposeProvider } from './ChannelComposeContext';
import { ChannelConfigProvider } from './ChannelConfigContext';
import { ChannelControlProvider } from './ChannelControlContext';
import { ChannelMessagesProvider } from './ChannelMessagesContext';

// ── ChannelProvider (orchestrator) ──

export function ChannelProvider({
  channelId,
  children,
  initialState,
  onTitleChange,
  onStatusChange,
}: {
  channelId: string;
  children: ReactNode;
  initialState?: ChannelInitialState;
  onTitleChange?: (title: string) => void;
  onStatusChange?: (status: 'default' | 'pending' | 'done') => void;
}) {
  const resetStreamingRefsRef = useRef(() => {});
  const messageQueueRef = useRef<string[]>([]);

  return (
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
  );
}
