import { type ControlPermissionResponse, EVENTS, type PendingControl } from '@code-quest/shared';
import type { RefObject } from 'react';
import type { TypedSocket } from '@/socket/client';
import { channelEmit } from '@/socket/rpc';
import type { ChannelState, PendingDiffReview, PendingElicitation } from '@/types/chat';
import { msg } from '@/utils/message';
import type { Payload } from './guard.ts';
import type { EffectDeps } from './notification.ts';

function getFeedbackLabel(response: ControlPermissionResponse): string {
  if ('continue' in response) {
    return response.continue ? 'Approved' : 'Denied';
  }
  if (response.behavior === 'allow') {
    return response.updatedPermissions ? 'Allowed Always' : 'Approved';
  }
  return response.interrupt ? 'Denied & Stopped' : 'Denied';
}

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

export const controlHandlers: {
  'control:elicitation': typeof onControlElicitation;
  'control:diff_review': typeof onControlDiffReview;
  'chat:cancel_request': typeof onCancelRequest;
} = {
  'control:elicitation': onControlElicitation,
  'control:diff_review': onControlDiffReview,
  'chat:cancel_request': onCancelRequest,
} satisfies Record<string, (state: ControlState, payload: never) => ControlState>;

function onControlMcpEffect(deps: EffectDeps, p: Payload<'control:mcp'>): void {
  const mcpMsg = p.message;
  deps.socket.emit(EVENTS.chat.respond, {
    channelId: deps.channelId,
    requestId: p.requestId,
    response: {
      jsonrpc: '2.0',
      result: {},
      id: typeof mcpMsg.id === 'string' || typeof mcpMsg.id === 'number' ? mcpMsg.id : null,
    },
  });
}

export const controlHandlerEffects: {
  'control:mcp': typeof onControlMcpEffect;
} = {
  'control:mcp': onControlMcpEffect,
} satisfies Record<string, (deps: EffectDeps, payload: never) => void>;

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
}: ControlActionsDeps): {
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
} {
  const emit = (event: string, payload: Record<string, unknown>, ...rest: unknown[]) =>
    channelEmit(socket, channelId, event, payload, ...rest);

  function respondToControl(response: ControlPermissionResponse, requestId?: string): void {
    const ctrls = controlsRef.current;
    const target = requestId ? ctrls.find((c) => c.requestId === requestId) : ctrls[0];
    if (!target) return;
    emit(EVENTS.chat.respond, { requestId: target.requestId, response });
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

  function diffRespond(toolId: string, accepted: boolean): void {
    const ctrl = controlsRef.current.find((c) => c.toolUseId === toolId);
    if (!ctrl) return;
    emit(EVENTS.chat.respond, {
      requestId: ctrl.requestId,
      response: accepted
        ? { behavior: 'allow' as const, updatedInput: {} }
        : { behavior: 'deny' as const, message: 'User rejected diff' },
    });
  }

  function stopTask(taskId: string): void {
    emit(EVENTS.chat.stop_task, { taskId });
  }

  function respondToElicitation(requestId: string, answer: string): void {
    emit(EVENTS.chat.respond, {
      requestId,
      response: { behavior: 'allow', updatedInput: { url: answer, value: answer } },
    });
    setElicitation(null);
  }

  function cancelElicitation(requestId: string): void {
    emit(EVENTS.chat.respond, { requestId, response: { behavior: 'deny' } });
    setElicitation(null);
  }

  function clearPendingDiffReview(): void {
    setDiffReview(null);
  }

  return {
    setPendingControls: setControls,
    setPendingElicitation: setElicitation,
    setPendingDiffReview: setDiffReview,
    getPendingControls: (): PendingControl[] => controlsRef.current,
    respondToControl: respondToControl,
    diffRespond: diffRespond,
    stopTask: stopTask,
    clearPendingDiffReview: clearPendingDiffReview,
    respondToElicitation: respondToElicitation,
    cancelElicitation: cancelElicitation,
  };
}
