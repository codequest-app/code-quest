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
import type { Channel } from '../channel.ts';
import type { ChannelEventRouter } from '../channel-event-router.ts';
import type { HandlerContext } from '../context.ts';
import type { SocketHandler, TypedSocket } from '../types.ts';
import { errMsg } from '../types.ts';

export function create(ctx: HandlerContext): SocketHandler {
  const interruptedChannels = new Set<string>();

  function handleSend(socket: TypedSocket, payload: unknown): void {
    try {
      const { channelId, message: textMessage } = chatSendSchema.parse(payload);
      interruptedChannels.delete(channelId);
      const channel = ctx.channelManager.get(channelId);
      if (!channel) return;
      channel.startProcessing();
      channel.sendMessage(textMessage);
      ctx.channelManager.broadcastSessionState(channelId, 'busy');

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
      const channel = ctx.channelManager.get(channelId);
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

  async function handleRespond(payload: unknown): Promise<void> {
    try {
      const { requestId, response } = chatRespondSchema.parse(payload);

      const match = ctx.channelManager.findByRequestId(requestId);
      if (!match) {
        logger.warn({ requestId }, 'No channel found for control_response');
        return;
      }
      const [channelId, channel] = match;
      if (!channel) return;

      // Notification response
      const notifResolve = channel.notificationRequests.get(requestId);
      if (notifResolve) {
        channel.notificationRequests.delete(requestId);
        notifResolve({ ...response });
        return;
      }

      const meta = channel.getControlRequestMeta(requestId);
      const { behavior, updatedInput, updatedPermissions, message } = response;

      const respondAndBroadcast = (cliResponse: Record<string, unknown>) => {
        channel.removeControlRequest(requestId);
        channel.respondToRequest(requestId, cliResponse);
        channel.emit('chat:cancel_request', { channelId, targetRequestId: requestId });
      };

      // mcp_message
      if (meta?.subtype === 'mcp_message') {
        const t = channel.mcpTimeouts.get(requestId);
        if (t) clearTimeout(t);
        channel.mcpTimeouts.delete(requestId);
        respondAndBroadcast({ ...response });
        return;
      }

      // elicitation
      if (meta?.subtype === 'elicitation') {
        const elicitationResponse =
          behavior === 'allow'
            ? {
                action: 'accept' as const,
                result: typeof updatedInput === 'object' && updatedInput ? updatedInput : {},
              }
            : { action: 'decline' as const };
        respondAndBroadcast({ ...elicitationResponse });
        return;
      }

      // Tool permission
      const responseObj: Record<string, unknown> = { behavior };
      if (updatedInput !== undefined) responseObj.updatedInput = updatedInput;
      if (message !== undefined) responseObj.message = message;
      if (updatedPermissions !== undefined) responseObj.updatedPermissions = updatedPermissions;
      if (meta?.toolUseId) responseObj.toolUseID = meta.toolUseId;

      // ExitPlanMode
      if (meta?.toolName === 'ExitPlanMode' && behavior === 'allow') {
        const comments = channel.planComments;
        if (comments.length > 0) {
          responseObj.userFeedback = comments
            .map((c) => `[Re: "${c.selectedText}"] ${c.comment}`)
            .join('\n');
          channel.planComments = [];
        }
      }

      respondAndBroadcast(responseObj);
    } catch (err) {
      logger.error({ err }, 'Failed to respond to control request');
    }
  }

  function handleStopTask(payload: unknown): void {
    try {
      const { channelId, taskId } = chatStopTaskSchema.parse(payload);
      const channel = ctx.channelManager.get(channelId);
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
      const channel = ctx.channelManager.get(channelId);
      if (channel) {
        channel
          .sendControlRequest('cancel_async_message', { message_uuid: messageUuid })
          .catch(() => {});
      }
    } catch {
      // ignore
    }
  }

  async function handleRewindCode(payload: unknown, callback: Function): Promise<void> {
    try {
      const { channelId, userMessageId, dryRun } = chatRewindCodeSchema.parse(payload);
      const channel = ctx.channelManager.get(channelId);
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
      const cancelMatch = ctx.channelManager.findByRequestId(targetRequestId);
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
      const channel = ctx.channelManager.get(channelId);
      if (channel) {
        channel.respondToRequest(requestId, response);
      }
    } catch {
      // ignore
    }
  }

  function onMessageResult(channelId: string, ch: Channel, _se: SocketEvent): void {
    ch.endProcessing();
    ctx.channelManager.broadcastSessionState(channelId, 'idle');

    const pendingPrompt = ch.sessionState.pendingTitlePrompt;
    if (pendingPrompt) {
      ch.updateSessionState({ pendingTitlePrompt: undefined });
      ch.sendControlRequest('generate_session_title', { description: pendingPrompt })
        .then((res) => {
          const { title } = controlGenerateTitleResponseSchema.parse(res.response);
          ctx.sessionStore
            .rename(channelId, title)
            .catch((e) => logger.warn({ err: e }, 'Failed to persist session title'));
          ctx.channelManager.broadcastSessionState(channelId, 'idle', title);
        })
        .catch((e) => logger.error({ err: e }, 'Failed to generate session title'));
    }
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
    },
  };
}
