import {
  diffReviewPayloadSchema,
  permissionPayloadSchema,
  requestIdPayloadSchema,
} from '@code-quest/shared';
import type { ServerAction } from '@code-quest/summoner';
import type { Channel } from '../channel.ts';
import type { ChannelEmitter } from '../channel-emitter.ts';

import type { SocketHandler } from '../types.ts';

export function create(emitter: ChannelEmitter): SocketHandler {

  function onCancel(ch: Channel | null, payload: unknown): void {
    if (!ch) return;
    const { requestId } = requestIdPayloadSchema.parse(payload);
    ch.removeControlRequest(requestId);
    emitter.emit(ch.id, 'chat:cancel_request', { channelId: ch.id, targetRequestId: requestId });
  }

  function onPermission(ch: Channel | null, payload: unknown): void {
    if (!ch) return;
    const { requestId, toolName, toolUseId } = permissionPayloadSchema.parse(payload);
    ch.trackControlRequest(requestId, { subtype: 'can_use_tool', toolName, toolUseId });
  }

  function onElicitation(ch: Channel | null, payload: unknown): void {
    if (!ch) return;
    const { requestId } = requestIdPayloadSchema.parse(payload);
    ch.trackControlRequest(requestId, { subtype: 'elicitation' });
  }

  function onDiffReview(ch: Channel | null, payload: unknown): void {
    if (!ch) return;
    const { toolId } = diffReviewPayloadSchema.parse(payload);
    ch.trackControlRequest(toolId, { subtype: 'open_diff' });
  }

  function onForwardToClient(ch: Channel | null, payload: unknown): void {
    if (!ch) return;
    const action = payload as ServerAction;
    if (action.action !== 'forward_to_client') return;

    ch.trackControlRequest(action.requestId, {
      subtype: action.subtype,
      toolName: action.toolName,
      toolUseId: action.toolUseId,
    });
    emitter.emit(ch.id, 'raw:event', {
      channelId: ch.id,
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
  }

  emitter.on('control:cancel', onCancel);
  emitter.on('control:permission', onPermission);
  emitter.on('control:elicitation', onElicitation);
  emitter.on('control:diff_review', onDiffReview);
  emitter.on('server:action', onForwardToClient);

  return { register() {} };
}
