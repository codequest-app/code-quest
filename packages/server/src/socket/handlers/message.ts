import {
  type ControlRespondPayload,
  cancelRequestPayloadSchema,
  chatCancelAsyncMessagePayloadSchema,
  chatCancelPayloadSchema,
  chatHookCallbackRespondPayloadSchema,
  chatRespondPayloadSchema,
  chatRewindCodePayloadSchema,
  chatSendPayloadSchema,
  chatStopTaskPayloadSchema,
  controlGenerateTitleResponseSchema,
  controlRespondPayloadSchema,
} from '@code-quest/shared';
import { logger } from '../../logger.ts';
import type { HandlerContext } from '../../types.ts';
import type { Channel } from '../channel.ts';
import { withChannel, withError, withSocket } from '../channel-emitter.ts';
import type { SocketCallback, TypedSocket } from '../types.ts';
import { errMsg } from '../utils/helpers.ts';
import { err, ok } from '../utils/rpc.ts';

/** Fire-and-forget sendRequest: log debug on failure, never throw. */
function fireSendRequest(ch: Channel, event: string, payload?: Record<string, unknown>): void {
  ch.sendRequest(event, payload).catch((err) => logger.debug({ err }, 'sendRequest failed'));
}

export function create({
  channelManager,
  sessionStore,
  planHandler: planApi,
  emitter,
}: Pick<HandlerContext, 'channelManager' | 'sessionStore' | 'planHandler' | 'emitter'>): void {
  const interruptedChannels = new Set<string>();

  function handleSend(ch: Channel, socket: TypedSocket, payload: unknown): void {
    try {
      const { channelId, message: textMessage } = chatSendPayloadSchema.parse(payload);
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
      const { channelId } = chatCancelPayloadSchema.parse(payload);
      if (interruptedChannels.has(channelId)) {
        ch.abort();
      } else {
        interruptedChannels.add(channelId);
        fireSendRequest(ch, 'message:interrupt');
      }
    } catch (err) {
      logger.debug({ err }, 'Failed to cancel');
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

  function buildElicitationResponse(response: ControlRespondPayload): Record<string, unknown> {
    const { behavior, updatedInput } = response;
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
    response: ControlRespondPayload,
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
      const { requestId, response } = chatRespondPayloadSchema.parse(payload);

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

      const parsed = controlRespondPayloadSchema.parse(response);

      let cliResponse: Record<string, unknown>;
      if (meta?.subtype === 'mcp_message') {
        cliResponse = buildMcpResponse(channel, requestId, response);
      } else if (meta?.subtype === 'elicitation') {
        cliResponse = buildElicitationResponse(parsed);
      } else {
        cliResponse = buildToolPermissionResponse(channelId, meta, parsed);
      }

      respondAndDismiss(channel, channelId, requestId, cliResponse);
    } catch (err) {
      logger.error({ err }, 'Failed to respond to control request');
    }
  }

  function handleStopTask(ch: Channel, payload: unknown): void {
    try {
      const { taskId } = chatStopTaskPayloadSchema.parse(payload);
      fireSendRequest(ch, 'message:stop_task', { task_id: taskId });
    } catch (err) {
      logger.debug({ err }, 'Failed to stop task');
    }
  }

  function handleCancelAsync(ch: Channel, payload: unknown): void {
    try {
      const { messageUuid } = chatCancelAsyncMessagePayloadSchema.parse(payload);
      fireSendRequest(ch, 'message:cancel_async', { message_uuid: messageUuid });
    } catch (err) {
      logger.debug({ err }, 'Failed to cancel async message');
    }
  }

  async function handleRewindCode(
    ch: Channel,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    try {
      const { userMessageId, dryRun } = chatRewindCodePayloadSchema.parse(payload);
      const result = await ch.sendRequest('message:rewind', {
        user_message_id: userMessageId ?? '',
        dry_run: dryRun ?? false,
      });
      callback?.(ok(result));
    } catch (e) {
      callback?.(err(errMsg(e, 'Failed to rewind code')));
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
    } catch (err) {
      logger.debug({ err }, 'Failed to cancel request');
    }
  }

  function handleHookRespond(ch: Channel, payload: unknown): void {
    try {
      const { requestId, response } = chatHookCallbackRespondPayloadSchema.parse(payload);
      ch.respondToRequest(requestId, response);
    } catch (err) {
      logger.debug({ err }, 'Failed to respond to hook');
    }
  }

  async function generateTitleIfNeeded(channelId: string, ch: Channel): Promise<void> {
    const pendingPrompt = ch.pendingTitlePrompt;
    if (!pendingPrompt) return;

    ch.pendingTitlePrompt = undefined;
    try {
      const res = await ch.sendRequest('session:generate_title', {
        description: pendingPrompt,
      });
      const parsed = controlGenerateTitleResponseSchema.safeParse(res.response);
      if (!parsed.success) return;
      const { title } = parsed.data;
      ch.title = title;
      sessionStore
        .renameByChannelId(channelId, title)
        .catch((e: unknown) => logger.warn({ err: e }, 'Failed to persist session title'));
      channelManager.broadcastSessionState(channelId, 'idle', title);
    } catch (e) {
      logger.error({ err: e }, 'Failed to generate session title');
    }
  }

  function onMessageResult(ch: Channel, _payload: unknown): void {
    ch.endProcessing();
    channelManager.broadcastSessionState(ch.channelId, 'idle');
  }

  function onMessageResultTitle(ch: Channel, _payload: unknown): void {
    generateTitleIfNeeded(ch.channelId, ch);
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
