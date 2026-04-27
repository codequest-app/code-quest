import { EVENTS, sessionLaunchResponseSchema } from '@code-quest/shared';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { SpinnerVerb } from '../../components/SpinnerVerb';
import type { ChannelChangeUpdate } from '../../types/chat';
import { useAppInitState } from '../AppInitContext';
import { useSocket } from '../SocketContext';
import { ChannelComposeProvider } from './ChannelComposeContext';
import { buildInitialConfig, ChannelConfigProvider } from './ChannelConfigContext';
import { ChannelControlProvider } from './ChannelControlContext';
import { ChannelMessagesProvider } from './ChannelMessagesContext';
import { ChannelMetaProvider } from './ChannelMetaContext';
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
  launchOnMount = false,
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
}) {
  const resetStreamingRefsRef = useRef(() => {});
  const messageQueueRef = useRef<string[]>([]);
  const { socket } = useSocket();
  const { initOptions } = useAppInitState();

  const [state, setState] = useState<ChannelState>(
    launchOnMount ? { status: 'connecting' } : { status: 'connected' },
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: launch is stable; one-shot guarded by launchedRef. cwd is read at launch time, not as a re-trigger.
  useEffect(() => {
    if (!launchOnMount || launchedRef.current) return;
    launch();
  }, [launchOnMount]);

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
    <ChannelMetaProvider channelId={channelId} cwd={cwd}>
      <ChannelSocketRouterProvider>
        <ChannelMessagesProvider
          onChange={onChange}
          dequeueMessage={() => messageQueueRef.current.shift()}
          messageQueueRef={messageQueueRef}
          resetStreamingRefsRef={resetStreamingRefsRef}
        >
          <ChannelControlProvider resetStreamingRefs={() => resetStreamingRefsRef.current()}>
            <ChannelConfigProvider
              initialConfig={buildInitialConfig(initOptions)}
              onNewChannel={onNewChannel}
            >
              <MessageVisibilityProvider>
                <ChannelComposeProvider>{children}</ChannelComposeProvider>
              </MessageVisibilityProvider>
            </ChannelConfigProvider>
          </ChannelControlProvider>
        </ChannelMessagesProvider>
      </ChannelSocketRouterProvider>
    </ChannelMetaProvider>
  );
}
