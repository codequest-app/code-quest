import type { SocketCallback, TypedSocket } from '@code-quest/shared';
import {
  type ControlRespondPayload,
  cancelRequestPayloadSchema,
  chatAskSideQuestionPayloadSchema,
  chatCancelAsyncMessagePayloadSchema,
  chatCancelPayloadSchema,
  chatHookCallbackRespondPayloadSchema,
  chatRespondPayloadSchema,
  chatRewindCodePayloadSchema,
  chatSendPayloadSchema,
  chatStopTaskPayloadSchema,
  controlGenerateTitleResponseSchema,
  controlRespondPayloadSchema,
  EVENTS,
} from '@code-quest/shared';
import { logger } from '../../logger.ts';
import type { HandlerContext } from '../../types.ts';
import type { Channel } from '../channel.ts';
import { withChannel, withError, withSocket } from '../channel-emitter.ts';
import { errMsg } from '../utils/helpers.ts';
import { err, ok } from '../utils/rpc.ts';

/** Fire-and-forget sendRequest: log debug on failure, never throw. */
function fireSendRequest(ch: Channel, event: string, payload?: Record<string, unknown>): void {
  ch.sendRequest(event, payload).catch((err) => logger.debug({ err }, 'sendRequest failed'));
}

/**
 * Parse payload with schema; invoke fn on success; log on failure.
 * @param level 'debug' for recoverable payload issues, 'error' for unexpected failures.
 */
function safeParseAndLog<T>(
  level: 'debug' | 'error',
  msg: string,
  schema: { parse(p: unknown): T },
  payload: unknown,
  fn: (parsed: T) => void,
): void {
  try {
    fn(schema.parse(payload));
  } catch (err) {
    logger[level]({ err }, msg);
  }
}

export function create({
  channelManager,
  sessionStore,
  planHandler: planApi,
  emitter,
}: Pick<HandlerContext, 'channelManager' | 'sessionStore' | 'planHandler' | 'emitter'>): void {
  const interruptedChannels = new Set<string>();

  function handleSend(ch: Channel, socket: TypedSocket, payload: unknown): void {
    safeParseAndLog(
      'error',
      'Failed to send message',
      chatSendPayloadSchema,
      payload,
      ({ channelId, message: textMessage }) => {
        interruptedChannels.delete(channelId);
        ch.startProcessing();
        ch.sendMessage(textMessage);
        channelManager.broadcastSessionState(channelId, 'busy');

        emitter.emitToOthers(channelId, socket.id, EVENTS.message.user, {
          channelId,
          content: [{ type: 'text', text: textMessage }],
        });

        if (!ch.titleGenerated) {
          ch.titleGenerated = true;
          ch.pendingTitlePrompt = textMessage;
        }
      },
    );
  }

  function handleCancel(ch: Channel, payload: unknown): void {
    safeParseAndLog(
      'debug',
      'Failed to cancel',
      chatCancelPayloadSchema,
      payload,
      ({ channelId }) => {
        if (interruptedChannels.has(channelId)) {
          ch.abort();
        } else {
          interruptedChannels.add(channelId);
          fireSendRequest(ch, 'message:interrupt');
        }
      },
    );
  }

  function respondAndDismiss(
    channel: Channel,
    channelId: string,
    requestId: string,
    cliResponse: Record<string, unknown>,
  ): void {
    channel.removeControlRequest(requestId);
    channel.respondToRequest(requestId, cliResponse);
    emitter.emit(channelId, EVENTS.chat.cancel_request, { channelId, targetRequestId: requestId });
  }

  function clearMcpTimeoutAndPassthrough(
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

      const meta = channel.getControlRequestMeta(requestId);

      const parsed = controlRespondPayloadSchema.parse(response);

      const subtypeBuilders: Record<string, () => Record<string, unknown>> = {
        mcp_message: () => clearMcpTimeoutAndPassthrough(channel, requestId, response),
        elicitation: () => buildElicitationResponse(parsed),
      };
      const build = (meta?.subtype && subtypeBuilders[meta.subtype]) || null;
      const cliResponse = build ? build() : buildToolPermissionResponse(channelId, meta, parsed);

      respondAndDismiss(channel, channelId, requestId, cliResponse);
    } catch (err) {
      logger.error({ err }, 'Failed to respond to control request');
    }
  }

  function handleStopTask(ch: Channel, payload: unknown): void {
    safeParseAndLog(
      'debug',
      'Failed to stop task',
      chatStopTaskPayloadSchema,
      payload,
      ({ taskId }) => fireSendRequest(ch, 'message:stop_task', { task_id: taskId }),
    );
  }

  function handleCancelAsync(ch: Channel, payload: unknown): void {
    safeParseAndLog(
      'debug',
      'Failed to cancel async message',
      chatCancelAsyncMessagePayloadSchema,
      payload,
      ({ messageUuid }) =>
        fireSendRequest(ch, 'message:cancel_async', { message_uuid: messageUuid }),
    );
  }

  async function handleRewindCode(
    ch: Channel,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    try {
      const { userMessageId } = chatRewindCodePayloadSchema.parse(payload);
      const result = await ch.sendRequest('message:rewind', {
        user_message_id: userMessageId ?? '',
        dry_run: false,
      });
      callback?.(ok(result));
    } catch (e) {
      callback?.(err(errMsg(e, 'Failed to rewind code')));
    }
  }

  async function handleAskSideQuestion(
    ch: Channel,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    try {
      const { question } = chatAskSideQuestionPayloadSchema.parse(payload);
      const result = await ch.sendRequest('message:side_question', { question });
      const answer = result.response?.response;
      if (answer === null || answer === undefined) {
        callback?.(err('No answer returned'));
        return;
      }
      callback?.(ok({ answer: String(answer) }));
    } catch (e) {
      callback?.(err(errMsg(e, 'Failed to ask side question')));
    }
  }

  function handleCancelRequest(_ch: Channel | null, payload: unknown): void {
    safeParseAndLog(
      'debug',
      'Failed to cancel request',
      cancelRequestPayloadSchema,
      payload,
      ({ targetRequestId }) => {
        const cancelMatch = channelManager.findByRequestId(targetRequestId);
        if (cancelMatch) {
          const [channelId, channel] = cancelMatch;
          channel.removeControlRequest(targetRequestId);
          channel.respondToRequest(targetRequestId, {
            behavior: 'deny',
            message: 'User cancelled',
            interrupt: false,
          });
          emitter.emit(channelId, EVENTS.chat.cancel_request, { channelId, targetRequestId });
        }
      },
    );
  }

  function handleHookRespond(ch: Channel, payload: unknown): void {
    safeParseAndLog(
      'debug',
      'Failed to respond to hook',
      chatHookCallbackRespondPayloadSchema,
      payload,
      ({ requestId, response }) => ch.respondToRequest(requestId, response),
    );
  }

  async function requestTitle(ch: Channel, prompt: string): Promise<string | null> {
    const res = await ch.sendRequest(EVENTS.session.generate_title, { description: prompt });
    const parsed = controlGenerateTitleResponseSchema.safeParse(res.response);
    return parsed.success ? parsed.data.title : null;
  }

  function persistTitle(channelId: string, title: string): void {
    sessionStore
      .renameByChannelId(channelId, title)
      .catch((e: unknown) => logger.warn({ err: e }, 'Failed to persist session title'));
  }

  function broadcastTitle(channelId: string, title: string): void {
    channelManager.broadcastSessionState(channelId, 'idle', title);
  }

  async function generateTitleIfNeeded(channelId: string, ch: Channel): Promise<void> {
    const pendingPrompt = ch.pendingTitlePrompt;
    if (!pendingPrompt) return;

    ch.pendingTitlePrompt = undefined;
    try {
      const title = await requestTitle(ch, pendingPrompt);
      if (!title) return;
      ch.title = title;
      persistTitle(channelId, title);
      broadcastTitle(channelId, title);
    } catch (e) {
      logger.error({ err: e }, 'Failed to generate session title');
    }
  }

  function onMessageResult(ch: Channel, _payload: unknown): void {
    ch.endProcessing();
    channelManager.broadcastSessionState(ch.channelId, 'idle');
    generateTitleIfNeeded(ch.channelId, ch);
  }

  function onChannelExit(ch: Channel): void {
    interruptedChannels.delete(ch.channelId);
  }

  emitter.on(EVENTS.message.result, withChannel(onMessageResult));
  emitter.on('channel:exit', withChannel(onChannelExit));
  emitter.on(EVENTS.chat.send, withSocket(handleSend));
  emitter.on(EVENTS.chat.cancel, withChannel(handleCancel));
  emitter.on(EVENTS.chat.respond, handleRespond);
  emitter.on(EVENTS.chat.stop_task, withChannel(handleStopTask));
  emitter.on(EVENTS.chat.cancel_async, withChannel(handleCancelAsync));
  emitter.on(EVENTS.chat.rewind_code, withError(withChannel(handleRewindCode)));
  emitter.on(EVENTS.chat.ask_side_question, withError(withChannel(handleAskSideQuestion)));
  emitter.on(EVENTS.chat.cancel_request, handleCancelRequest);
  emitter.on(EVENTS.chat.hook_respond, withChannel(handleHookRespond));
}
