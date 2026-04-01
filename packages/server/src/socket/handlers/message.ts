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
  type SocketEvent,
} from '@code-quest/shared';
import { logger } from '../../logger.ts';
import type { SessionStore } from '../../services/session-store.ts';
import type { Channel } from '../channel.ts';
import type { ChannelEventRouter } from '../channel-event-router.ts';
import type { ChannelManager } from '../channel-manager.ts';
import type { SocketCallback, SocketHandler, TypedSocket } from '../types.ts';
import { errMsg } from '../utils/helpers.ts';
import type { PlanApi } from './plan.ts';

export function create(
  channelManager: ChannelManager,
  sessionStore: SessionStore,
  planApi: PlanApi,
): SocketHandler {
  const interruptedChannels = new Set<string>();

  function handleSend(socket: TypedSocket, payload: unknown): void {
    try {
      const { channelId, message: textMessage } = chatSendSchema.parse(payload);
      interruptedChannels.delete(channelId);
      const channel = channelManager.get(channelId);
      if (!channel) return;
      channel.startProcessing();
      channel.sendMessage(textMessage);
      channelManager.broadcastSessionState(channelId, 'busy');

      channel.emitToOthers(socket, 'message:user', {
        channelId,
        content: [{ type: 'text', text: textMessage }],
      });

      if (!channel.sessionState.titleGenerated) {
        channel.updateSessionState({ titleGenerated: true, pendingTitlePrompt: textMessage });
      }
    } catch (err) {
      logger.error({ err }, 'Failed to send message');
    }
  }

  function handleCancel(payload: unknown): void {
    try {
      const { channelId } = chatInterruptSchema.parse(payload);
      const channel = channelManager.get(channelId);
      if (!channel) return;
      if (interruptedChannels.has(channelId)) {
        channel.abort();
      } else {
        interruptedChannels.add(channelId);
        channel.sendControlRequest('interrupt').catch(() => {});
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
    channel.emit('chat:cancel_request', { channelId, targetRequestId: requestId });
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

  async function handleRespond(payload: unknown): Promise<void> {
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

  function handleStopTask(payload: unknown): void {
    try {
      const { channelId, taskId } = chatStopTaskSchema.parse(payload);
      const channel = channelManager.get(channelId);
      if (channel) {
        channel.sendControlRequest('stop_task', { task_id: taskId }).catch(() => {});
      }
    } catch {
      // ignore
    }
  }

  function handleCancelAsync(payload: unknown): void {
    try {
      const { channelId, messageUuid } = chatCancelAsyncMessageSchema.parse(payload);
      const channel = channelManager.get(channelId);
      if (channel) {
        channel
          .sendControlRequest('cancel_async_message', { message_uuid: messageUuid })
          .catch(() => {});
      }
    } catch {
      // ignore
    }
  }

  async function handleRewindCode(payload: unknown, callback: SocketCallback): Promise<void> {
    try {
      const { channelId, userMessageId, dryRun } = chatRewindCodeSchema.parse(payload);
      const channel = channelManager.get(channelId);
      if (!channel) {
        callback({ success: false, error: 'Session not found' });
        return;
      }
      const result = await channel.sendControlRequest('rewind_files', {
        user_message_id: userMessageId ?? '',
        dry_run: dryRun ?? false,
      });
      callback(result);
    } catch (err) {
      callback({ success: false, error: errMsg(err, 'Failed to rewind code') });
    }
  }

  function handleCancelRequest(payload: unknown): void {
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
        channel.emit('chat:cancel_request', { channelId, targetRequestId });
      }
    } catch {
      // ignore
    }
  }

  function handleHookRespond(payload: unknown): void {
    try {
      const { channelId, requestId, response } = chatHookCallbackRespondSchema.parse(payload);
      const channel = channelManager.get(channelId);
      if (channel) {
        channel.respondToRequest(requestId, response);
      }
    } catch {
      // ignore
    }
  }

  function generateTitleIfNeeded(channelId: string, ch: Channel): void {
    const pendingPrompt = ch.sessionState.pendingTitlePrompt;
    if (!pendingPrompt) return;

    ch.updateSessionState({ pendingTitlePrompt: undefined });
    ch.sendControlRequest('generate_session_title', { description: pendingPrompt })
      .then((res) => {
        const { title } = controlGenerateTitleResponseSchema.parse(res.response);
        sessionStore
          .rename(channelId, title)
          .catch((e) => logger.warn({ err: e }, 'Failed to persist session title'));
        channelManager.broadcastSessionState(channelId, 'idle', title);
      })
      .catch((e) => logger.error({ err: e }, 'Failed to generate session title'));
  }

  function onMessageResult(channelId: string, ch: Channel, _se: SocketEvent): void {
    ch.endProcessing();
    channelManager.broadcastSessionState(channelId, 'idle');
  }

  function onMessageResultTitle(channelId: string, ch: Channel, _se: SocketEvent): void {
    generateTitleIfNeeded(channelId, ch);
  }

  return {
    register(socket: TypedSocket) {
      socket.on('chat:send', (p) => handleSend(socket, p));
      socket.on('chat:cancel', handleCancel);
      socket.on('chat:respond', handleRespond);
      socket.on('chat:stop_task', handleStopTask);
      socket.on('chat:cancel_async', handleCancelAsync);
      socket.on('chat:rewind_code', handleRewindCode);
      socket.on('chat:cancel_request', handleCancelRequest);
      socket.on('chat:hook_respond', handleHookRespond);
    },
    subscribe(router: ChannelEventRouter) {
      router.onEvent('message:result', onMessageResult);
      router.onEvent('message:result', onMessageResultTitle);
    },
  };
}
