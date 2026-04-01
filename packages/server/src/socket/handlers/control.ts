import {
  diffReviewPayloadSchema,
  permissionPayloadSchema,
  requestIdPayloadSchema,
  type SocketEvent,
} from '@code-quest/shared';
import type { ServerAction } from '@code-quest/summoner';
import type { Channel } from '../channel.ts';
import type { HandlerContext } from '../context.ts';

export function onRunnerEvent(
  ctx: HandlerContext,
  channelId: string,
  ch: Channel,
  se: SocketEvent,
): boolean {
  switch (se.name) {
    case 'control:cancel': {
      const { requestId } = requestIdPayloadSchema.parse(se.payload);
      ch.removeControlRequest(requestId);
      ctx.emitToSession(channelId, 'chat:cancel_request', {
        channelId,
        targetRequestId: requestId,
      });
      return true;
    }
    case 'control:permission': {
      const { requestId, toolName, toolUseId } = permissionPayloadSchema.parse(se.payload);
      ch.trackControlRequest(requestId, { subtype: 'can_use_tool', toolName, toolUseId });
      return true;
    }
    case 'control:elicitation': {
      const { requestId } = requestIdPayloadSchema.parse(se.payload);
      ch.trackControlRequest(requestId, { subtype: 'elicitation' });
      return true;
    }
    case 'control:diff_review': {
      const { toolId } = diffReviewPayloadSchema.parse(se.payload);
      ch.trackControlRequest(toolId, { subtype: 'open_diff' });
      return true;
    }
    default:
      return false;
  }
}

export function onServerAction(
  ctx: HandlerContext,
  channelId: string,
  ch: Channel,
  action: ServerAction,
): boolean {
  if (action.action !== 'forward_to_client') return false;

  ch.trackControlRequest(action.requestId, {
    subtype: action.subtype,
    toolName: action.toolName,
    toolUseId: action.toolUseId,
  });
  ctx.emitToSession(channelId, 'raw:event', {
    channelId,
    rawType: `control_request/${action.subtype}`,
    data: {
      requestId: action.requestId,
      subtype: action.subtype,
      toolName: action.toolName,
      toolUseId: action.toolUseId,
      input: action.input,
      suggestions: action.suggestions,
      callbackId: action.callbackId,
    },
  });
  return true;
}
