import { EVENTS, sessionLaunchResponseSchema } from '@code-quest/shared';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { SpinnerVerb } from '@/components/chat/SpinnerVerb';
import { EmptyState } from '@/components/workspace/EmptyState';
import type { ChannelChangeUpdate, ChannelState as ChannelStateType } from '@/types/chat';
import { useAppInitState } from '../AppInitContext.tsx';
import { useSocket } from '../SocketContext.tsx';
import { ChannelComposeProvider } from './ChannelComposeContext.tsx';
import { buildInitialConfig, ChannelConfigProvider } from './ChannelConfigContext.tsx';
import { ChannelControlProvider } from './ChannelControlContext.tsx';
import { ChannelMessagesProvider } from './ChannelMessagesContext.tsx';
import { ChannelMetaProvider } from './ChannelMetaContext.tsx';
import { ChannelSocketRouterProvider } from './ChannelSocketRouterContext.tsx';
import { MessageVisibilityProvider } from './MessageVisibilityContext.tsx';

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
  launchOnMount = false,
  initialState,
}: {
  channelId: string;
  children: ReactNode;
  onChange?: (update: ChannelChangeUpdate) => void;
  onNewChannel?: (cwd: string) => void;
  cwd?: string;
  /** True when this provider must spawn the session via `session:launch`
   *  on mount (createNewTab path). False when the channel already exists
   *  on the server (resume / fork — `cwd` is just identity, not a launch
   *  trigger). Replaces the legacy "cwd-as-sentinel" behaviour. */
  launchOnMount?: boolean;
  initialState?: Partial<ChannelStateType>;
}): React.JSX.Element {
  const messageQueueRef = useRef<string[]>([]);
  const { socket } = useSocket();
  const { initOptions } = useAppInitState();

  const [state, setState] = useState<ChannelState>({ status: 'connecting' });
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
      // Don't set connected yet — ChannelMessagesProvider's join will call onJoinComplete.
    });
  }

  function handleJoinComplete() {
    setState((prev) => (prev.status === 'error' ? prev : { status: 'connected' }));
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: launch is stable; one-shot guarded by launchedRef.
  useEffect(() => {
    if (launchOnMount && !launchedRef.current) launch();
  }, [launchOnMount]);

  // ── Content based on state ──
  let content: ReactNode;
  if (state.status === 'connecting') {
    content = (
      <div className="flex flex-1 items-center justify-center">
        <SpinnerVerb verbs={['Connecting']} />
      </div>
    );
  } else if (state.status === 'error') {
    content = (
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
  } else {
    content = children;
  }

  // ── Always render full provider tree ──
  return (
    <ChannelMetaProvider channelId={channelId} cwd={cwd}>
      <ChannelSocketRouterProvider>
        <ChannelMessagesProvider
          onChange={onChange}
          onJoinComplete={handleJoinComplete}
          dequeueMessage={() => messageQueueRef.current.shift()}
          messageQueueRef={messageQueueRef}
          initialState={initialState}
        >
          <ChannelControlProvider>
            <ChannelConfigProvider
              initialConfig={buildInitialConfig(initOptions)}
              onNewChannel={onNewChannel}
            >
              <MessageVisibilityProvider>
                <ChannelComposeProvider>{content}</ChannelComposeProvider>
              </MessageVisibilityProvider>
            </ChannelConfigProvider>
          </ChannelControlProvider>
        </ChannelMessagesProvider>
      </ChannelSocketRouterProvider>
    </ChannelMetaProvider>
  );
}
