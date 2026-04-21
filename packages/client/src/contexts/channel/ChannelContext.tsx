import { EVENTS, sessionLaunchResponseSchema } from '@code-quest/shared';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { SpinnerVerb } from '../../components/SpinnerVerb';
import type { ChannelChangeUpdate } from '../../types/chat';
import { useSocket } from '../SocketContext';
import { ChannelComposeProvider } from './ChannelComposeContext';
import { ChannelConfigProvider } from './ChannelConfigContext';
import { ChannelControlProvider } from './ChannelControlContext';
import { ChannelIdProvider } from './ChannelIdContext';
import { ChannelMessagesProvider } from './ChannelMessagesContext';
import { ChannelSocketRouterProvider } from './ChannelSocketRouterContext';
import { MessageVisibilityProvider } from './MessageVisibilityContext';

// ── ChannelProvider (orchestrator) ──

type ChannelState =
  | { status: 'connecting' }
  | { status: 'connected' }
  | { status: 'error'; message: string };

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

  const [state, setState] = useState<ChannelState>(
    cwd ? { status: 'connecting' } : { status: 'connected' },
  );
  const launchedRef = useRef(false);

  function launch() {
    if (!cwd) return;
    launchedRef.current = true;
    setState({ status: 'connecting' });
    socket.emit(EVENTS.session.launch, { channelId, cwd }, (raw: unknown) => {
      const parsed = sessionLaunchResponseSchema.safeParse(raw);
      if (!parsed.success) {
        setState({ status: 'error', message: 'Failed to connect' });
        return;
      }
      if (!parsed.data.ok) {
        setState({ status: 'error', message: parsed.data.error });
        return;
      }
      setState({ status: 'connected' });
    });
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: launch is stable (only captures refs + setState), deps are channelId/cwd/socket
  useEffect(() => {
    if (!cwd || launchedRef.current) return;
    launch();
  }, [cwd]);

  // ── Connecting ──
  if (state.status === 'connecting') {
    return (
      <div className="flex flex-1 items-center justify-center">
        <SpinnerVerb verbs={['Connecting']} />
      </div>
    );
  }

  // ── Error ──
  if (state.status === 'error') {
    return (
      <EmptyState
        icon="⚠"
        message={state.message}
        actionLabel="Retry"
        onAction={() => {
          launchedRef.current = false;
          launch();
        }}
      />
    );
  }

  // ── Connected — full provider tree ──
  return (
    <ChannelIdProvider channelId={channelId}>
      <ChannelSocketRouterProvider>
        <ChannelMessagesProvider
          onChange={onChange}
          dequeueMessage={() => messageQueueRef.current.shift()}
          messageQueueRef={messageQueueRef}
          resetStreamingRefsRef={resetStreamingRefsRef}
        >
          <ChannelControlProvider resetStreamingRefs={() => resetStreamingRefsRef.current()}>
            <ChannelConfigProvider onNewChannel={onNewChannel}>
              <MessageVisibilityProvider>
                <ChannelComposeProvider>{children}</ChannelComposeProvider>
              </MessageVisibilityProvider>
            </ChannelConfigProvider>
          </ChannelControlProvider>
        </ChannelMessagesProvider>
      </ChannelSocketRouterProvider>
    </ChannelIdProvider>
  );
}
