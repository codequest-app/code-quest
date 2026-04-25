import type { ControlPermissionResponse, PendingControl } from '@code-quest/shared';
import { EVENTS } from '@code-quest/shared';
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import type { PendingDiffReview, PendingElicitation } from '../../types/chat';
import { msg } from '../../utils/message';
import { useSocket } from '../SocketContext';
import { useChannelMessagesActions } from './ChannelMessagesContext';
import { useChannelId } from './ChannelMetaContext';
import { useChannelSocketRouter } from './ChannelSocketRouterContext';
import type { Payload } from './handlers/guard';
import type { EffectDeps } from './handlers/notification';
import {
  type ControlState,
  controlHandlerEffects,
  controlHandlers,
  createControlActions,
} from './handlers/permission';

interface ChannelControlValue {
  pendingControls: PendingControl[];
  pendingElicitation: PendingElicitation | null;
  pendingDiffReview: PendingDiffReview | null;
  setPendingControls: (fn: (prev: PendingControl[]) => PendingControl[]) => void;
  setPendingElicitation: (v: PendingElicitation | null) => void;
  setPendingDiffReview: (v: PendingDiffReview | null) => void;
  getPendingControls: () => PendingControl[];
  respondToControl: (response: ControlPermissionResponse, requestId?: string) => void;
  diffRespond: (toolId: string, accepted: boolean) => void;
  stopTask: (taskId: string) => void;
  clearPendingDiffReview: () => void;
  respondToElicitation: (requestId: string, answer: string) => void;
  cancelElicitation: (requestId: string) => void;
}

type ControlStateValue = Pick<
  ChannelControlValue,
  'pendingControls' | 'pendingElicitation' | 'pendingDiffReview'
>;
type ControlActionsValue = Omit<ChannelControlValue, keyof ControlStateValue>;

const ControlStateContext = createContext<ControlStateValue | null>(null);
const ControlActionsContext = createContext<ControlActionsValue | null>(null);

export function useChannelControl(): ChannelControlValue {
  const state = useContext(ControlStateContext);
  const actions = useContext(ControlActionsContext);
  if (!state || !actions)
    throw new Error('useChannelControl must be used within a ChannelProvider');
  return { ...state, ...actions };
}

export function ChannelControlProvider({
  resetStreamingRefs,
  children,
}: {
  resetStreamingRefs: () => void;
  children: ReactNode;
}) {
  const channelId = useChannelId();
  const { socket } = useSocket();
  const { setChannelState } = useChannelMessagesActions();

  // ── Own pending state ──
  const [controls, setControls] = useState<PendingControl[]>([]);
  const [elicitation, setElicitation] = useState<PendingElicitation | null>(null);
  const [diffReview, setDiffReview] = useState<PendingDiffReview | null>(null);

  const controlsRef = useRef(controls);
  const elicitationRef = useRef(elicitation);
  const diffReviewRef = useRef(diffReview);
  useLayoutEffect(() => {
    controlsRef.current = controls;
    elicitationRef.current = elicitation;
    diffReviewRef.current = diffReview;
  });

  function setControlState(fn: (prev: ControlState) => ControlState) {
    const prev: ControlState = {
      controls: controlsRef.current,
      elicitation: elicitationRef.current,
      diffReview: diffReviewRef.current,
    };
    const next = fn(prev);
    if (next.controls !== prev.controls) setControls(() => next.controls);
    if (next.elicitation !== prev.elicitation) setElicitation(next.elicitation);
    if (next.diffReview !== prev.diffReview) setDiffReview(next.diffReview);
  }

  function addControlAndMessage(
    control: PendingControl,
    messageRole: 'assistant' | 'system',
    messageContent: string,
  ) {
    resetStreamingRefs();
    setControls((prev) => [...prev, control]);
    setChannelState((s) => ({
      ...s,
      messages: [
        ...s.messages,
        msg({
          role: messageRole,
          type: 'pending_action',
          content: messageContent,
          meta: { requestId: control.requestId, input: control.input },
        }),
      ],
    }));
  }

  function onControlPermission(payload: Payload<'control:permission'>) {
    addControlAndMessage(
      {
        requestId: payload.requestId,
        subtype: 'can_use_tool',
        toolName: payload.toolName,
        toolUseId: payload.toolUseId,
        input: payload.input,
        permissionSuggestions: payload.suggestions,
      },
      'assistant',
      payload.toolName,
    );
  }

  function onControlHookCallback(payload: Payload<'control:hook_callback'>) {
    addControlAndMessage(
      {
        requestId: payload.requestId,
        subtype: 'hook_callback',
        callbackId: payload.callbackId,
        input: payload.input,
        toolUseId: payload.toolUseId,
      },
      'system',
      `Hook callback: ${payload.callbackId}`,
    );
  }

  function onSessionClosed(payload: Payload<'session:closed'>) {
    resetStreamingRefs();
    setControls([]);
    setChannelState((prev) => ({
      ...prev,
      messages: [
        ...prev.messages,
        ...(payload.error ? [msg({ role: 'system', type: 'error', content: payload.error })] : []),
        msg({ role: 'system', type: 'text', content: 'CLI session has ended.' }),
      ],
      status: 'idle',
    }));
  }

  const router = useChannelSocketRouter();

  // ── Auto-wiring: handler map events (pure local state) + control:mcp effect ──
  // biome-ignore lint/correctness/useExhaustiveDependencies: setControlState uses refs which are stable
  useEffect(() => {
    if (!channelId) return;
    return router.register<ControlState, EffectDeps>(controlHandlers, setControlState, {
      effects: controlHandlerEffects,
      effectDeps: { socket, channelId },
    });
  }, [channelId, socket, router]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: handlers use channelId which is stable for effect
  useEffect(() => {
    if (!channelId) return;
    const off1 = router.on(EVENTS.control.permission, onControlPermission);
    const off2 = router.on(EVENTS.control.hook_callback, onControlHookCallback);
    const off3 = router.on(EVENTS.session.closed, onSessionClosed);
    return () => {
      off1();
      off2();
      off3();
    };
  }, [channelId, router]);

  // ── Stable actions ──
  const actions = createControlActions({
    socket,
    channelId,
    controlsRef,
    setControls,
    setElicitation,
    setDiffReview,
    setChannelState,
  });

  return (
    <ControlActionsContext.Provider value={actions}>
      <ControlStateContext.Provider
        value={{
          pendingControls: controls,
          pendingElicitation: elicitation,
          pendingDiffReview: diffReview,
        }}
      >
        {children}
      </ControlStateContext.Provider>
    </ControlActionsContext.Provider>
  );
}
