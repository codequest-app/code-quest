import {
  diffReviewPayloadSchema,
  permissionPayloadSchema,
  requestIdPayloadSchema,
} from '@code-quest/shared';
import type { ServerAction } from '@code-quest/summoner';
import type { Channel } from '../channel.ts';
import { type ChannelEmitter, withChannel } from '../channel-emitter.ts';

export function create(emitter: ChannelEmitter): void {
  function onCancel(ch: Channel, payload: unknown): void {
    const { requestId } = requestIdPayloadSchema.parse(payload);
    ch.removeControlRequest(requestId);
    emitter.emit(ch.id, 'chat:cancel_request', { channelId: ch.id, targetRequestId: requestId });
  }

  function onPermission(ch: Channel, payload: unknown): void {
    const { requestId, toolName, toolUseId } = permissionPayloadSchema.parse(payload);
    ch.trackControlRequest(requestId, { subtype: 'can_use_tool', toolName, toolUseId });
  }

  function onElicitation(ch: Channel, payload: unknown): void {
    const { requestId } = requestIdPayloadSchema.parse(payload);
    ch.trackControlRequest(requestId, { subtype: 'elicitation' });
  }

  function onDiffReview(ch: Channel, payload: unknown): void {
    const { toolId } = diffReviewPayloadSchema.parse(payload);
    ch.trackControlRequest(toolId, { subtype: 'open_diff' });
  }

  function onForwardToClient(ch: Channel, payload: unknown): void {
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

  emitter.on('control:cancel', withChannel(onCancel));
  emitter.on('control:permission', withChannel(onPermission));
  emitter.on('control:elicitation', withChannel(onElicitation));
  emitter.on('control:diff_review', withChannel(onDiffReview));
  emitter.on('server:action', withChannel(onForwardToClient));
}
