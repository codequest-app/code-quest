import type { ServerToClientEvents } from '@code-quest/shared';
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { PendingControl, PendingDiffReview, PendingElicitation } from '../../types/chat';
import { msg } from '../../utils/message';
import { useSocket } from '../SocketContext';
import { useChannelMessages } from './ChannelMessagesContext';
import { createGuard, wireHandlers } from './handlers/guard';
import { type ControlState, controlHandlers, createControlActions } from './handlers/permission';

type Payload<E extends keyof ServerToClientEvents> = Parameters<ServerToClientEvents[E]>[0];

export interface ChannelControlValue {
  pendingControls: PendingControl[];
  pendingElicitation: PendingElicitation | null;
  pendingDiffReview: PendingDiffReview | null;
  setPendingControls: (fn: (prev: PendingControl[]) => PendingControl[]) => void;
  setPendingElicitation: (v: PendingElicitation | null) => void;
  setPendingDiffReview: (v: PendingDiffReview | null) => void;
  getPendingControls: () => PendingControl[];
  respondToControl: (
    response: import('@code-quest/shared').ControlPermissionResponse,
    requestId?: string,
  ) => void;
  diffRespond: (toolId: string, accepted: boolean) => void;
  stopTask: (taskId: string) => void;
  clearPendingDiffReview: () => void;
  respondToElicitation: (requestId: string, answer: string) => void;
  cancelElicitation: (requestId: string) => void;
}

const ChannelControlContext = createContext<ChannelControlValue | null>(null);

export function useChannelControl(): ChannelControlValue {
  const ctx = useContext(ChannelControlContext);
  if (!ctx) throw new Error('useChannelControl must be used within a ChannelProvider');
  return ctx;
}

export function ChannelControlProvider({
  channelId,
  resetStreamingRefs,
  children,
}: {
  channelId: string;
  resetStreamingRefs: () => void;
  children: ReactNode;
}) {
  const { socket } = useSocket();
  const { setChannelState } = useChannelMessages();

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

  // ── Auto-wiring: handler map events (pure local state) ──
  useEffect(() => {
    if (!channelId) return;

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

    return wireHandlers(socket, channelId, controlHandlers, setControlState);
  }, [channelId, socket]);

  // ── Special: control:permission + control:hook_callback (local state + parent state + resetRef) ──
  useEffect(() => {
    if (!channelId) return;
    const guard = createGuard(channelId);

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
      if (!guard(payload)) return;
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
      if (!guard(payload)) return;
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

    socket.on('control:permission', onControlPermission);
    socket.on('control:hook_callback', onControlHookCallback);
    return () => {
      socket.off('control:permission', onControlPermission);
      socket.off('control:hook_callback', onControlHookCallback);
    };
  }, [channelId, socket, setChannelState, resetStreamingRefs]);

  // ── Special: session:closed (reset + parent state) ──
  useEffect(() => {
    if (!channelId) return;
    const guard = createGuard(channelId);
    function onSessionClosed(payload: Payload<'session:closed'>) {
      if (!guard(payload)) return;
      resetStreamingRefs();
      setControls([]);
      setChannelState((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          ...(payload.error
            ? [msg({ role: 'system', type: 'error', content: payload.error })]
            : []),
          msg({ role: 'system', type: 'text', content: 'CLI session has ended.' }),
        ],
        status: 'idle',
      }));
    }
    socket.on('session:closed', onSessionClosed);
    return () => {
      socket.off('session:closed', onSessionClosed);
    };
  }, [channelId, socket, setChannelState, resetStreamingRefs]);

  // ── Special: control:mcp (side effect only — auto-respond) ──
  useEffect(() => {
    if (!channelId) return;
    const guard = createGuard(channelId);
    function onControlMcp(payload: Payload<'control:mcp'>) {
      if (!guard(payload)) return;
      const mcpMsg = payload.message;
      socket.emit('chat:respond', {
        channelId,
        requestId: payload.requestId,
        response: {
          jsonrpc: '2.0',
          result: {},
          id: typeof mcpMsg.id === 'string' || typeof mcpMsg.id === 'number' ? mcpMsg.id : null,
        },
      });
    }
    socket.on('control:mcp', onControlMcp);
    return () => {
      socket.off('control:mcp', onControlMcp);
    };
  }, [channelId, socket]);

  // ── Stable actions ──
  const actions = useMemo(
    () =>
      createControlActions({
        socket,
        channelId,
        controlsRef,
        setControls,
        setElicitation,
        setDiffReview,
        setChannelState,
      }),
    [socket, channelId, setChannelState],
  );

  // ── Context value ──
  const value = useMemo<ChannelControlValue>(
    () => ({
      pendingControls: controls,
      pendingElicitation: elicitation,
      pendingDiffReview: diffReview,
      ...actions,
    }),
    [controls, elicitation, diffReview, actions],
  );

  return <ChannelControlContext.Provider value={value}>{children}</ChannelControlContext.Provider>;
}
