import { sessionLaunchResponseSchema } from '@code-quest/shared';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { SpinnerVerb } from '../../components/SpinnerVerb';
import type { ChannelChangeUpdate } from '../../types/chat';
import { useSocket } from '../SocketContext';
import { ChannelComposeProvider } from './ChannelComposeContext';
import { ChannelConfigProvider } from './ChannelConfigContext';
import { ChannelControlProvider } from './ChannelControlContext';
import { ChannelMessagesProvider } from './ChannelMessagesContext';

// ── ChannelProvider (orchestrator) ──

export function ChannelProvider({
  channelId,
  children,
  onChange,
  onNewChannel,
  cwd,
}: {
  channelId: string;
  children: ReactNode;
  onChange?: (update: ChannelChangeUpdate) => void;
  onNewChannel?: (cwd: string) => void;
  cwd?: string;
}) {
  const resetStreamingRefsRef = useRef(() => {});
  const messageQueueRef = useRef<string[]>([]);
  const { socket } = useSocket();

  const [launched, setLaunched] = useState(!cwd);
  const launchedRef = useRef(false);
  useEffect(() => {
    if (!cwd || launchedRef.current) return;
    launchedRef.current = true;
    socket.emit('session:launch', { channelId, cwd }, (raw: unknown) => {
      const parsed = sessionLaunchResponseSchema.safeParse(raw);
      if (!parsed.success || parsed.data.error) {
        console.error('[session:launch] failed', parsed.success ? parsed.data.error : parsed.error);
      }
      setLaunched(true);
    });
  }, [channelId, cwd, socket]);

  // ── Wait for launch to complete before rendering children ──
  if (!launched) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <SpinnerVerb verbs={['Connecting']} />
      </div>
    );
  }

  // ── Full provider tree ──
  return (
    <ChannelMessagesProvider
      channelId={channelId}
      onChange={onChange}
      dequeueMessage={() => messageQueueRef.current.shift()}
      messageQueueRef={messageQueueRef}
      resetStreamingRefsRef={resetStreamingRefsRef}
    >
      <ChannelControlProvider
        channelId={channelId}
        resetStreamingRefs={() => resetStreamingRefsRef.current()}
      >
        <ChannelConfigProvider channelId={channelId} onNewChannel={onNewChannel}>
          <ChannelComposeProvider channelId={channelId}>{children}</ChannelComposeProvider>
        </ChannelConfigProvider>
      </ChannelControlProvider>
    </ChannelMessagesProvider>
  );
}
