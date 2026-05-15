import {
  controlForwardPayloadSchema,
  controlOpenDiffPayloadSchema,
  EVENTS,
  permissionPayloadSchema,
  requestIdPayloadSchema,
} from '@code-quest/schemas';
import { logger } from '../../logger.ts';
import type { HandlerContext } from '../../types.ts';
import type { Channel } from '../channel.ts';
import { withChannel } from '../channel-emitter.ts';

export function create({
  emitter,
  diffFileService,
}: Pick<HandlerContext, 'emitter' | 'diffFileService'>): void {
  function onCancel(ch: Channel, payload: unknown): void {
    const { requestId } = requestIdPayloadSchema.parse(payload);
    ch.removeControlRequest(requestId);
    emitter.emit(ch.channelId, EVENTS.chat.cancel_request, {
      channelId: ch.channelId,
      targetRequestId: requestId,
    });
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
    const { requestId, subtype, toolName, toolUseId, input, suggestions, callbackId } =
      controlForwardPayloadSchema.parse(payload);

    ch.trackControlRequest(requestId, { subtype, toolName, toolUseId });
    emitter.emit(ch.channelId, EVENTS.raw.event, {
      channelId: ch.channelId,
      rawType: `control_request/${subtype}`,
      data: { requestId, subtype, toolName, toolUseId, input, suggestions, callbackId },
    });
  }

  async function onOpenDiff(ch: Channel, payload: unknown): Promise<void> {
    const { requestId, originalPath, newPath } = controlOpenDiffPayloadSchema.parse(payload);
    try {
      const [oldContent, newContent] = await Promise.all([
        diffFileService.read(originalPath),
        diffFileService.read(newPath),
      ]);
      ch.trackControlRequest(requestId, { subtype: 'open_diff' });
      emitter.emit(ch.channelId, EVENTS.control.diff_review, {
        channelId: ch.channelId,
        requestId,
        toolId: requestId,
        filePath: originalPath || newPath,
        oldContent,
        newContent,
      });
    } catch (err) {
      logger.warn({ err }, 'open_diff failed to read files');
      ch.respondToRequest(requestId, { behavior: 'deny', message: 'Failed to read files' });
    }
  }

  emitter.on(EVENTS.control.cancel, withChannel(onCancel));
  emitter.on(EVENTS.control.permission, withChannel(onPermission));
  emitter.on(EVENTS.control.elicitation, withChannel(onElicitation));
  emitter.on(EVENTS.control.forward, withChannel(onForwardToClient));
  emitter.on(EVENTS.control.open_diff, withChannel(onOpenDiff));
}
