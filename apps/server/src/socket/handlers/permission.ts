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
    const parsed = requestIdPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      logger.warn({ err: parsed.error }, 'onCancel: invalid payload');
      return;
    }
    const { requestId } = parsed.data;
    ch.removeControlRequest(requestId);
    emitter.emit(ch.channelId, EVENTS.chat.cancel_request, {
      channelId: ch.channelId,
      targetRequestId: requestId,
    });
  }

  function onPermission(ch: Channel, payload: unknown): void {
    const parsed = permissionPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      logger.warn({ err: parsed.error }, 'onPermission: invalid payload');
      return;
    }
    const { requestId, toolName, toolUseId } = parsed.data;
    ch.trackControlRequest(requestId, { subtype: 'can_use_tool', toolName, toolUseId });
  }

  function onElicitation(ch: Channel, payload: unknown): void {
    const parsed = requestIdPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      logger.warn({ err: parsed.error }, 'onElicitation: invalid payload');
      return;
    }
    const { requestId } = parsed.data;
    ch.trackControlRequest(requestId, { subtype: 'elicitation' });
  }

  function onForwardToClient(ch: Channel, payload: unknown): void {
    const parsed = controlForwardPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      logger.warn({ err: parsed.error }, 'onForwardToClient: invalid payload');
      return;
    }
    const { requestId, subtype, toolName, toolUseId, input, suggestions, callbackId } = parsed.data;

    ch.trackControlRequest(requestId, { subtype, toolName, toolUseId });
    emitter.emit(ch.channelId, EVENTS.raw.event, {
      channelId: ch.channelId,
      rawType: `control_request/${subtype}`,
      data: { requestId, subtype, toolName, toolUseId, input, suggestions, callbackId },
    });
  }

  async function onOpenDiff(ch: Channel, payload: unknown): Promise<void> {
    const p = controlOpenDiffPayloadSchema.safeParse(payload);
    if (!p.success) {
      logger.warn({ err: p.error }, 'onOpenDiff: invalid payload');
      return;
    }
    const { requestId, originalPath, newPath } = p.data;
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
