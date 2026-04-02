import {
  diffReviewPayloadSchema,
  permissionPayloadSchema,
  requestIdPayloadSchema,
} from '@code-quest/shared';
import type { ServerAction } from '@code-quest/summoner';
import type { Channel } from '../channel.ts';
import type { ChannelEmitter } from '../channel-emitter.ts';

import type { SocketHandler } from '../types.ts';

export function create(): SocketHandler {
  let emitterRef: ChannelEmitter;

  function onCancel(_channelId: string, ch: Channel, se: { payload: unknown }): void {
    const { requestId } = requestIdPayloadSchema.parse(se.payload);
    ch.removeControlRequest(requestId);
    emitterRef.emit(ch.id, 'chat:cancel_request', { channelId: ch.id, targetRequestId: requestId });
  }

  function onPermission(_channelId: string, ch: Channel, se: { payload: unknown }): void {
    const { requestId, toolName, toolUseId } = permissionPayloadSchema.parse(se.payload);
    ch.trackControlRequest(requestId, { subtype: 'can_use_tool', toolName, toolUseId });
  }

  function onElicitation(_channelId: string, ch: Channel, se: { payload: unknown }): void {
    const { requestId } = requestIdPayloadSchema.parse(se.payload);
    ch.trackControlRequest(requestId, { subtype: 'elicitation' });
  }

  function onDiffReview(_channelId: string, ch: Channel, se: { payload: unknown }): void {
    const { toolId } = diffReviewPayloadSchema.parse(se.payload);
    ch.trackControlRequest(toolId, { subtype: 'open_diff' });
  }

  function onForwardToClient(channelId: string, ch: Channel, action: ServerAction): boolean {
    if (action.action !== 'forward_to_client') return false;

    ch.trackControlRequest(action.requestId, {
      subtype: action.subtype,
      toolName: action.toolName,
      toolUseId: action.toolUseId,
    });
    emitterRef.emit(channelId, 'raw:event', {
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

  return {
    register() {},
    subscribe(emitter: ChannelEmitter) {
      emitterRef = emitter;
      emitter.on('control:cancel', onCancel);
      emitter.on('control:permission', onPermission);
      emitter.on('control:elicitation', onElicitation);
      emitter.on('control:diff_review', onDiffReview);
      emitter.onAction(onForwardToClient);
    },
  };
}
