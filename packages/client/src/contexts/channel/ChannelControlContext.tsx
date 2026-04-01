import type { ServerToClientEvents } from '@code-quest/shared';
import { createContext, type ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { PendingControl, PendingDiffReview, PendingElicitation } from '../../types/chat';
import type { ChannelState } from '../../types/chat';
import { msg } from '../../utils/message';
import { useSocket } from '../SocketContext';
import { useChannelMessages } from './ChannelMessagesContext';
import { type ControlState, controlHandlers, createControlActions } from './controlHandlers';

type Payload<E extends keyof ServerToClientEvents> = Parameters<ServerToClientEvents[E]>[0];

export interface ChannelControlValue {
  pendingControls: PendingControl[];
  pendingElicitation: PendingElicitation | null;
  pendingDiffReview: PendingDiffReview | null;
  setPendingControls: (fn: (prev: PendingControl[]) => PendingControl[]) => void;
  setPendingElicitation: (v: PendingElicitation | null) => void;
  setPendingDiffReview: (v: PendingDiffReview | null) => void;
  getPendingControls: () => PendingControl[];
  respondToControl: (response: import('@code-quest/shared').ControlPermissionResponse, requestId?: string) => void;
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
  initialPendingControls,
  resetStreamingRefs,
  children,
}: {
  channelId: string;
  initialPendingControls?: PendingControl[];
  resetStreamingRefs: () => void;
  children: ReactNode;
}) {
  const { socket } = useSocket();
  const { setChannelState } = useChannelMessages();

  // ── Own pending state ──
  const [controls, setControls] = useState<PendingControl[]>(() => initialPendingControls ?? []);
  const [elicitation, setElicitation] = useState<PendingElicitation | null>(null);
  const [diffReview, setDiffReview] = useState<PendingDiffReview | null>(null);

  const controlsRef = useRef(controls);
  controlsRef.current = controls;

  const guard = (payload: { channelId: string }) =>
    payload.channelId === channelId || payload.channelId === '';

  // ── Auto-wiring: handler map events (pure local state) ──
  useEffect(() => {
    if (!channelId) return;

    const entries = Object.entries(controlHandlers) as Array<
      [string, (state: ControlState, payload: never) => Partial<ControlState>]
    >;
    const wired = entries.map(([event, handler]) => {
      const fn = (payload: { channelId: string }) => {
        if (!guard(payload)) return;
        const patch = handler(
          { controls: controlsRef.current, elicitation, diffReview },
          payload as never,
        );
        if (patch.controls !== undefined) setControls(() => patch.controls!);
        if (patch.elicitation !== undefined) setElicitation(patch.elicitation);
        if (patch.diffReview !== undefined) setDiffReview(patch.diffReview);
      };
      socket.on(event as never, fn as never);
      return { event, fn };
    });

    return () => {
      for (const { event, fn } of wired) {
        socket.off(event as never, fn as never);
      }
    };
  }, [channelId, socket]);

  // ── Special: control:permission (local state + parent state + resetRef) ──
  useEffect(() => {
    if (!channelId) return;
    const onControlPermission = (payload: Payload<'control:permission'>) => {
      if (!guard(payload)) return;
      resetStreamingRefs();
      setControls((prev) => [
        ...prev,
        {
          requestId: payload.requestId,
          subtype: 'can_use_tool',
          toolName: payload.toolName,
          toolUseId: payload.toolUseId,
          input: payload.input,
          permissionSuggestions: payload.suggestions,
        },
      ]);
      setChannelState((s) => ({
        ...s,
        messages: [
          ...s.messages,
          msg({
            role: 'assistant',
            type: 'pending_action',
            content: payload.toolName,
            meta: { requestId: payload.requestId, input: payload.input },
          }),
        ],
      }));
    };
    socket.on('control:permission', onControlPermission);
    return () => { socket.off('control:permission', onControlPermission); };
  }, [channelId, socket, setChannelState, resetStreamingRefs]);

  // ── Special: control:hook_callback (local state + parent state + resetRef) ──
  useEffect(() => {
    if (!channelId) return;
    const onControlHookCallback = (payload: Payload<'control:hook_callback'>) => {
      if (!guard(payload)) return;
      resetStreamingRefs();
      setControls((prev) => [
        ...prev,
        {
          requestId: payload.requestId,
          subtype: 'hook_callback',
          callbackId: payload.callbackId,
          input: payload.input,
          toolUseId: payload.toolUseId,
        },
      ]);
      setChannelState((s) => ({
        ...s,
        messages: [
          ...s.messages,
          msg({
            role: 'system',
            type: 'pending_action',
            content: `Hook callback: ${payload.callbackId}`,
            meta: { requestId: payload.requestId, input: payload.input },
          }),
        ],
      }));
    };
    socket.on('control:hook_callback', onControlHookCallback);
    return () => { socket.off('control:hook_callback', onControlHookCallback); };
  }, [channelId, socket, setChannelState, resetStreamingRefs]);

  // ── Special: session:closed (reset + parent state) ──
  useEffect(() => {
    if (!channelId) return;
    const onSessionClosed = (payload: Payload<'session:closed'>) => {
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
    };
    socket.on('session:closed', onSessionClosed);
    return () => { socket.off('session:closed', onSessionClosed); };
  }, [channelId, socket, setChannelState, resetStreamingRefs]);

  // ── Special: control:mcp (side effect only — auto-respond) ──
  useEffect(() => {
    if (!channelId) return;
    const onControlMcp = (payload: Payload<'control:mcp'>) => {
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
    };
    socket.on('control:mcp', onControlMcp);
    return () => { socket.off('control:mcp', onControlMcp); };
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
