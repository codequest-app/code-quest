import {
  cancelRequestPayloadSchema,
  chatCancelAsyncMessageSchema,
  chatHookCallbackRespondSchema,
  chatInterruptSchema,
  chatRespondSchema,
  chatRewindCodeSchema,
  chatSendSchema,
  chatStopTaskSchema,
  controlGenerateTitleResponseSchema,
} from '@code-quest/shared';
import { logger } from '../../logger.ts';
import type { SessionStore } from '../../services/session-store.ts';
import type { Channel } from '../channel.ts';
import { type ChannelEmitter, withChannel, withError, withSocket } from '../channel-emitter.ts';
import type { ChannelManager } from '../channel-manager.ts';
import type { SocketCallback, TypedSocket } from '../types.ts';
import { errMsg } from '../utils/helpers.ts';
import type { PlanApi } from './plan.ts';

export function create(
  channelManager: ChannelManager,
  sessionStore: SessionStore,
  planApi: PlanApi,
  emitter: ChannelEmitter,
): void {
  const interruptedChannels = new Set<string>();

  function handleSend(ch: Channel, socket: TypedSocket, payload: unknown): void {
    try {
      const { channelId, message: textMessage } = chatSendSchema.parse(payload);
      interruptedChannels.delete(channelId);
      ch.startProcessing();
      ch.sendMessage(textMessage);
      channelManager.broadcastSessionState(channelId, 'busy');

      emitter.emitToOthers(channelId, socket.id, 'message:user', {
        channelId,
        content: [{ type: 'text', text: textMessage }],
      });

      if (!ch.titleGenerated) {
        ch.titleGenerated = true;
        ch.pendingTitlePrompt = textMessage;
      }
    } catch (err) {
      logger.error({ err }, 'Failed to send message');
    }
  }

  function handleCancel(ch: Channel, payload: unknown): void {
    try {
      const { channelId } = chatInterruptSchema.parse(payload);
      if (interruptedChannels.has(channelId)) {
        ch.abort();
      } else {
        interruptedChannels.add(channelId);
        ch.sendControlRequest('interrupt').catch(() => {});
      }
    } catch {
      // ignore
    }
  }

  function respondAndDismiss(
    channel: Channel,
    channelId: string,
    requestId: string,
    cliResponse: Record<string, unknown>,
  ): void {
    channel.removeControlRequest(requestId);
    channel.respondToRequest(requestId, cliResponse);
    emitter.emit(channelId, 'chat:cancel_request', { channelId, targetRequestId: requestId });
  }

  function buildMcpResponse(
    channel: Channel,
    requestId: string,
    response: Record<string, unknown>,
  ): Record<string, unknown> {
    channel.clearMcpTimeout(requestId);
    return { ...response };
  }

  function buildElicitationResponse(
    behavior: unknown,
    updatedInput: unknown,
  ): Record<string, unknown> {
    return behavior === 'allow'
      ? {
          action: 'accept' as const,
          result: typeof updatedInput === 'object' && updatedInput ? updatedInput : {},
        }
      : { action: 'decline' as const };
  }

  function buildToolPermissionResponse(
    channelId: string,
    meta: { toolName?: string; toolUseId?: string } | undefined,
    response: {
      behavior?: string;
      updatedInput?: unknown;
      updatedPermissions?: unknown;
      message?: string;
    },
  ): Record<string, unknown> {
    const { behavior, updatedInput, updatedPermissions, message } = response;
    const result: Record<string, unknown> = { behavior };
    if (updatedInput !== undefined) result.updatedInput = updatedInput;
    if (message !== undefined) result.message = message;
    if (updatedPermissions !== undefined) result.updatedPermissions = updatedPermissions;
    if (meta?.toolUseId) result.toolUseID = meta.toolUseId;

    if (meta?.toolName === 'ExitPlanMode' && behavior === 'allow') {
      const feedback = planApi.consumeCommentsAsUserFeedback(channelId);
      if (feedback) result.userFeedback = feedback;
    }

    return result;
  }

  async function handleRespond(_ch: Channel | null, payload: unknown): Promise<void> {
    try {
      const { requestId, response } = chatRespondSchema.parse(payload);

      const match = channelManager.findByRequestId(requestId);
      if (!match) {
        logger.warn({ requestId }, 'No channel found for control_response');
        return;
      }
      const [channelId, channel] = match;
      if (!channel) return;

      // Notification response
      if (channel.resolveNotificationRequest(requestId, { ...response })) {
        return;
      }

      const meta = channel.getControlRequestMeta(requestId);

      let cliResponse: Record<string, unknown>;
      if (meta?.subtype === 'mcp_message') {
        cliResponse = buildMcpResponse(channel, requestId, response);
      } else if (meta?.subtype === 'elicitation') {
        cliResponse = buildElicitationResponse(response.behavior, response.updatedInput);
      } else {
        cliResponse = buildToolPermissionResponse(channelId, meta, response);
      }

      respondAndDismiss(channel, channelId, requestId, cliResponse);
    } catch (err) {
      logger.error({ err }, 'Failed to respond to control request');
    }
  }

  function handleStopTask(ch: Channel, payload: unknown): void {
    try {
      const { taskId } = chatStopTaskSchema.parse(payload);
      ch.sendControlRequest('stop_task', { task_id: taskId }).catch(() => {});
    } catch {
      // ignore
    }
  }

  function handleCancelAsync(ch: Channel, payload: unknown): void {
    try {
      const { messageUuid } = chatCancelAsyncMessageSchema.parse(payload);
      ch.sendControlRequest('cancel_async_message', { message_uuid: messageUuid }).catch(() => {});
    } catch {
      // ignore
    }
  }

  async function handleRewindCode(ch: Channel, payload: unknown, _socket?: TypedSocket, callback?: SocketCallback): Promise<void> {
    try {
      const { userMessageId, dryRun } = chatRewindCodeSchema.parse(payload);
      const result = await ch.sendControlRequest('rewind_files', {
        user_message_id: userMessageId ?? '',
        dry_run: dryRun ?? false,
      });
      callback?.(result);
    } catch (err) {
      callback?.({ success: false, error: errMsg(err, 'Failed to rewind code') });
    }
  }

  function handleCancelRequest(_ch: Channel | null, payload: unknown): void {
    try {
      const { targetRequestId } = cancelRequestPayloadSchema.parse(payload);
      const cancelMatch = channelManager.findByRequestId(targetRequestId);
      if (cancelMatch) {
        const [channelId, channel] = cancelMatch;
        channel.removeControlRequest(targetRequestId);
        channel.respondToRequest(targetRequestId, {
          behavior: 'deny',
          message: 'User cancelled',
          interrupt: false,
        });
        emitter.emit(channelId, 'chat:cancel_request', { channelId, targetRequestId });
      }
    } catch {
      // ignore
    }
  }

  function handleHookRespond(ch: Channel, payload: unknown): void {
    try {
      const { requestId, response } = chatHookCallbackRespondSchema.parse(payload);
      ch.respondToRequest(requestId, response);
    } catch {
      // ignore
    }
  }

  async function generateTitleIfNeeded(channelId: string, ch: Channel): Promise<void> {
    const pendingPrompt = ch.pendingTitlePrompt;
    if (!pendingPrompt) return;

    ch.pendingTitlePrompt = undefined;
    try {
      const res = await ch.sendControlRequest('generate_session_title', {
        description: pendingPrompt,
      });
      const { title } = controlGenerateTitleResponseSchema.parse(res.response);
      ch.title = title;
      sessionStore
        .rename(channelId, title)
        .catch((e) => logger.warn({ err: e }, 'Failed to persist session title'));
      channelManager.broadcastSessionState(channelId, 'idle', title);
    } catch (e) {
      logger.error({ err: e }, 'Failed to generate session title');
    }
  }

  function onMessageResult(ch: Channel, _payload: unknown): void {
    ch.endProcessing();
    channelManager.broadcastSessionState(ch.id, 'idle');
  }

  function onMessageResultTitle(ch: Channel, _payload: unknown): void {
    generateTitleIfNeeded(ch.id, ch);
  }

  emitter.on('message:result', withChannel(onMessageResult));
  emitter.on('message:result', withChannel(onMessageResultTitle));
  emitter.on('chat:send', withSocket(handleSend));
  emitter.on('chat:cancel', withChannel(handleCancel));
  emitter.on('chat:respond', handleRespond);
  emitter.on('chat:stop_task', withChannel(handleStopTask));
  emitter.on('chat:cancel_async', withChannel(handleCancelAsync));
  emitter.on('chat:rewind_code', withError(withChannel(handleRewindCode)));
  emitter.on('chat:cancel_request', handleCancelRequest);
  emitter.on('chat:hook_respond', withChannel(handleHookRespond));
}
