import { permissionPayloadSchema, requestIdPayloadSchema } from '@code-quest/shared';
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

  function onForwardToClient(ch: Channel, payload: unknown): void {
    const { requestId, subtype, toolName, toolUseId, input, suggestions, callbackId } = payload as {
      requestId: string;
      subtype: string;
      toolName?: string;
      toolUseId?: string;
      input?: unknown;
      suggestions?: unknown[];
      callbackId?: string;
    };

    ch.trackControlRequest(requestId, { subtype, toolName, toolUseId });
    emitter.emit(ch.id, 'raw:event', {
      channelId: ch.id,
      rawType: `control_request/${subtype}`,
      data: { requestId, subtype, toolName, toolUseId, input, suggestions, callbackId },
    });
  }

  emitter.on('control:cancel', withChannel(onCancel));
  emitter.on('control:permission', withChannel(onPermission));
  emitter.on('control:elicitation', withChannel(onElicitation));
  emitter.on('control:forward', withChannel(onForwardToClient));
}
