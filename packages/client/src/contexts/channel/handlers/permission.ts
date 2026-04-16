import type { ControlPermissionResponse, PendingControl } from '@code-quest/shared';
import type { RefObject } from 'react';
import type { TypedSocket } from '@/socket/client';
import { channelEmit } from '@/socket/rpc';
import type { ChannelState, PendingDiffReview, PendingElicitation } from '@/types/chat';
import { getFeedbackLabel } from '@/utils/feedback-label';
import { msg } from '@/utils/message';
import type { Payload } from './guard';
import type { EffectDeps } from './notification';

// ── On handlers (pure state) ──

export interface ControlState {
  controls: PendingControl[];
  elicitation: PendingElicitation | null;
  diffReview: PendingDiffReview | null;
}

function onControlElicitation(
  state: ControlState,
  payload: Payload<'control:elicitation'>,
): ControlState {
  return {
    ...state,
    elicitation: {
      requestId: payload.requestId,
      prompt: payload.prompt,
      inputType: payload.inputType ?? 'text',
      options: payload.options,
      url: payload.url,
    },
  };
}

function onControlDiffReview(
  state: ControlState,
  payload: Payload<'control:diff_review'>,
): ControlState {
  return {
    ...state,
    diffReview: {
      toolId: payload.toolId,
      oldContent: payload.oldContent,
      newContent: payload.newContent,
      filePath: payload.filePath,
    },
  };
}

function onCancelRequest(
  state: ControlState,
  payload: Payload<'chat:cancel_request'>,
): ControlState {
  return {
    ...state,
    controls: state.controls.filter((c) => c.requestId !== payload.targetRequestId),
  };
}

export const controlHandlers = {
  'control:elicitation': onControlElicitation,
  'control:diff_review': onControlDiffReview,
  'chat:cancel_request': onCancelRequest,
} satisfies Record<string, (state: ControlState, payload: never) => ControlState>;

// ── Effect handlers (side effects, no state change) ──

function onControlMcpEffect(deps: EffectDeps, p: Payload<'control:mcp'>): void {
  const mcpMsg = p.message;
  deps.socket.emit('chat:respond', {
    channelId: deps.channelId,
    requestId: p.requestId,
    response: {
      jsonrpc: '2.0',
      result: {},
      id: typeof mcpMsg.id === 'string' || typeof mcpMsg.id === 'number' ? mcpMsg.id : null,
    },
  });
}

export const controlHandlerEffects = {
  'control:mcp': onControlMcpEffect,
} satisfies Record<string, (deps: EffectDeps, payload: never) => void>;

// ── Emit actions (send) ──

interface ControlActionsDeps {
  socket: TypedSocket;
  channelId: string;
  controlsRef: RefObject<PendingControl[]>;
  setControls: (fn: (prev: PendingControl[]) => PendingControl[]) => void;
  setElicitation: (v: PendingElicitation | null) => void;
  setDiffReview: (v: PendingDiffReview | null) => void;
  setChannelState: (fn: (prev: ChannelState) => ChannelState) => void;
}

export function createControlActions({
  socket,
  channelId,
  controlsRef,
  setControls,
  setElicitation,
  setDiffReview,
  setChannelState,
}: ControlActionsDeps) {
  const emit = (event: string, payload: Record<string, unknown>, ...rest: unknown[]) =>
    channelEmit(socket, channelId, event, payload, ...rest);

  function respondToControl(response: ControlPermissionResponse, requestId?: string) {
    const ctrls = controlsRef.current;
    const target = requestId ? ctrls.find((c) => c.requestId === requestId) : ctrls[0];
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
  }

  function diffRespond(toolId: string, accepted: boolean) {
    const ctrl = controlsRef.current.find((c) => c.toolUseId === toolId);
    if (!ctrl) return;
    emit('chat:respond', {
      requestId: ctrl.requestId,
      response: accepted
        ? { behavior: 'allow' as const, updatedInput: {} }
        : { behavior: 'deny' as const, message: 'User rejected diff' },
    });
  }

  function stopTask(taskId: string) {
    emit('chat:stop_task', { taskId });
  }

  function respondToElicitation(requestId: string, answer: string) {
    emit('chat:respond', {
      requestId,
      response: { behavior: 'allow', updatedInput: { url: answer, value: answer } },
    });
    setElicitation(null);
  }

  function cancelElicitation(requestId: string) {
    emit('chat:respond', { requestId, response: { behavior: 'deny' } });
    setElicitation(null);
  }

  function clearPendingDiffReview() {
    setDiffReview(null);
  }

  return {
    setPendingControls: setControls,
    setPendingElicitation: setElicitation,
    setPendingDiffReview: setDiffReview,
    getPendingControls: () => controlsRef.current,
    respondToControl,
    diffRespond,
    stopTask,
    clearPendingDiffReview,
    respondToElicitation,
    cancelElicitation,
  };
}
