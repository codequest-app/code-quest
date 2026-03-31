import type { ControlPermissionResponse, ServerToClientEvents } from '@code-quest/shared';
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { channelEmit } from '../../socket/rpc';
import type { PendingControl, PendingDiffReview, PendingElicitation } from '../../types/chat';
import { getFeedbackLabel } from '../../utils/feedback-label';
import { msg } from '../../utils/message';
import { useSocket } from '../SocketContext';
import { useChannelMessages } from './ChannelMessagesContext';

type Payload<E extends keyof ServerToClientEvents> = Parameters<ServerToClientEvents[E]>[0];

export interface ChannelControlValue {
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

  // ── Socket events ──
  useEffect(() => {
    if (!channelId) return;

    const guard = (payload: { channelId: string }) =>
      payload.channelId === channelId || payload.channelId === '';

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

    const onControlElicitation = (payload: Payload<'control:elicitation'>) => {
      if (!guard(payload)) return;
      setElicitation({
        requestId: payload.requestId,
        prompt: payload.prompt,
        inputType: payload.inputType ?? 'text',
        options: payload.options,
        url: payload.url,
      });
    };

    const onControlDiffReview = (payload: Payload<'control:diff_review'>) => {
      if (!guard(payload)) return;
      setDiffReview({
        toolId: payload.toolId,
        oldContent: payload.oldContent,
        newContent: payload.newContent,
        filePath: payload.filePath,
      });
    };

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

    const onCancelRequest = (payload: Payload<'chat:cancel_request'>) => {
      if (!guard(payload)) return;
      setControls((prev) => prev.filter((c) => c.requestId !== payload.targetRequestId));
    };

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

    socket.on('control:permission', onControlPermission);
    socket.on('control:elicitation', onControlElicitation);
    socket.on('control:diff_review', onControlDiffReview);
    socket.on('control:hook_callback', onControlHookCallback);
    socket.on('chat:cancel_request', onCancelRequest);
    socket.on('session:closed', onSessionClosed);
    socket.on('control:mcp', onControlMcp);

    return () => {
      socket.off('control:permission', onControlPermission);
      socket.off('control:elicitation', onControlElicitation);
      socket.off('control:diff_review', onControlDiffReview);
      socket.off('control:hook_callback', onControlHookCallback);
      socket.off('chat:cancel_request', onCancelRequest);
      socket.off('session:closed', onSessionClosed);
      socket.off('control:mcp', onControlMcp);
    };
  }, [channelId, socket, setChannelState, resetStreamingRefs]);

  // ── Stable actions (don't depend on controls/elicitation/diffReview state) ──
  const actions = useMemo(() => {
    const emit = (event: string, payload: Record<string, unknown>, ...rest: unknown[]) =>
      channelEmit(socket, channelId, event, payload, ...rest);

    const respondToControl = (response: ControlPermissionResponse, requestId?: string) => {
      const ctrls = controlsRef.current;
      const target = requestId
        ? (ctrls.find((c) => c.requestId === requestId) ?? ctrls[0])
        : ctrls[0];
      if (!target) return;
      emit('chat:respond', { requestId: target.requestId, response });
      const controlLabel = target.toolName ?? target.subtype;
      const action = getFeedbackLabel(response);
      setControls((prev) => prev.filter((c) => c.requestId !== target.requestId));
      setChannelState((s) => ({
        ...s,
        messages: [
          ...s.messages,
          msg({ role: 'user', type: 'action_result', content: `${action}: ${controlLabel}` }),
        ],
      }));
    };

    const diffRespond = (toolId: string, accepted: boolean) => {
      const ctrl = controlsRef.current.find((c) => c.toolUseId === toolId);
      if (!ctrl) return;
      emit('chat:respond', {
        requestId: ctrl.requestId,
        response: accepted
          ? { behavior: 'allow' as const, updatedInput: {} }
          : { behavior: 'deny' as const, message: 'User rejected diff' },
      });
    };

    return {
      setPendingControls: setControls,
      setPendingElicitation: setElicitation,
      setPendingDiffReview: setDiffReview,
      getPendingControls: () => controlsRef.current,
      respondToControl,
      diffRespond,
      stopTask: (taskId: string) => emit('chat:stop_task', { taskId }),
      clearPendingDiffReview: () => setDiffReview(null),
      respondToElicitation: (requestId: string, answer: string) => {
        emit('chat:respond', {
          requestId,
          response: { behavior: 'allow', updatedInput: { url: answer, value: answer } },
        });
        setElicitation(null);
      },
      cancelElicitation: (requestId: string) => {
        emit('chat:respond', { requestId, response: { behavior: 'deny' } });
        setElicitation(null);
      },
    };
  }, [socket, channelId, setChannelState]);

  // ── Context value (state + stable actions) ──
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
