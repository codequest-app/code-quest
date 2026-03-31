import {
  chatCancelAsyncMessageSchema,
  chatHookCallbackRespondSchema,
  chatInterruptSchema,
  chatRespondSchema,
  chatRewindCodeSchema,
  chatSendSchema,
  chatStopTaskSchema,
} from '@code-quest/shared';
import type { HandlerContext, TypedSocket } from '../handler-context.ts';
import { errMsg } from '../handler-context.ts';

export function register(socket: TypedSocket, ctx: HandlerContext): void {
  // chat:send — alias for send_message
  socket.on('chat:send', (payload) => {
    try {
      const { channelId, message: textMessage } = chatSendSchema.parse(payload);
      interruptedChannels.delete(channelId);
      const runner = ctx.requireRunner(socket, channelId);
      if (!runner) return;
      const channel = ctx.channelManager.get(channelId);
      runner.sendMessage(textMessage);
      ctx.broadcastSessionState(channelId, 'busy');

      // Broadcast user message to other windows joined to this channel
      channel?.emitToOthers(socket, 'message:user', {
        channelId,
        content: [{ type: 'text', text: textMessage }],
      });
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  });

  const interruptedChannels = new Set<string>();
  socket.on('chat:cancel', (payload) => {
    try {
      const { channelId } = chatInterruptSchema.parse(payload);
      const channel = ctx.channelManager.get(channelId);
      if (!channel) return;
      if (interruptedChannels.has(channelId)) {
        // Second cancel → force abort
        channel.runner.abort();
      } else {
        // First cancel → graceful interrupt
        interruptedChannels.add(channelId);
        channel.sendControlRequest('interrupt').catch(() => {});
      }
    } catch {
      // ignore
    }
  });

  /** Unified response handler — replaces `tool_permission_response`. */
  socket.on('chat:respond', async (payload) => {
    try {
      const { requestId, response } = chatRespondSchema.parse(payload);

      // Single lookup for both notification and control requests
      const match = ctx.channelManager.findByRequestId(requestId);
      if (!match) {
        console.warn('[control_response] No channel found for requestId:', requestId);
        return;
      }
      const [channelId, channel] = match;
      if (!channel) return;

      // Notification response — resolve and exit early
      const notifResolve = channel.notificationRequests.get(requestId);
      if (notifResolve) {
        channel.notificationRequests.delete(requestId);
        notifResolve({ ...response });
        return;
      }

      const meta = channel.getControlRequestMeta(requestId);
      const { behavior, updatedInput, updatedPermissions, message } = response;

      // Common cleanup + respond + broadcast
      const respondAndBroadcast = (cliResponse: Record<string, unknown>) => {
        channel.removeControlRequest(requestId);
        channel.runner.respondToControlRequest(requestId, cliResponse);
        ctx.emitToSession(channelId, 'chat:cancel_request', {
          channelId,
          targetRequestId: requestId,
        });
      };

      // mcp_message — relay JSON-RPC response, clear timeout
      if (meta?.subtype === 'mcp_message') {
        const t = channel.mcpTimeouts.get(requestId);
        if (t) clearTimeout(t);
        channel.mcpTimeouts.delete(requestId);
        respondAndBroadcast({ ...response });
        return;
      }

      // elicitation — convert to accept/decline format
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

      // Tool permission — build response object
      const responseObj: Record<string, unknown> = { behavior };
      if (updatedInput !== undefined) responseObj.updatedInput = updatedInput;
      if (message !== undefined) responseObj.message = message;
      if (updatedPermissions !== undefined) responseObj.updatedPermissions = updatedPermissions;
      if (meta?.toolUseId) responseObj.toolUseID = meta.toolUseId;

      // ExitPlanMode — serialize plan comments as userFeedback
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
      console.error('Failed to respond to control request:', err);
    }
  });

  socket.on('chat:stop_task', (payload) => {
    try {
      const { channelId, taskId } = chatStopTaskSchema.parse(payload);
      const channel = ctx.channelManager.get(channelId);
      if (channel) {
        channel.sendControlRequest('stop_task', { task_id: taskId }).catch(() => {
          // ignore
        });
      }
    } catch {
      // ignore
    }
  });

  socket.on('chat:cancel_async', (payload) => {
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
  });

  socket.on('chat:rewind_code', async (payload, callback) => {
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
  });

  socket.on('chat:cancel_request', (payload) => {
    const { targetRequestId } = payload;
    const cancelMatch = ctx.channelManager.findByRequestId(targetRequestId);
    if (cancelMatch) {
      const [channelId, channel] = cancelMatch;
      channel.removeControlRequest(targetRequestId);
      channel.runner.respondToControlRequest(targetRequestId, {
        behavior: 'deny',
        message: 'User cancelled',
        interrupt: false,
      });
      // Broadcast to all sockets so other windows dismiss the pending banner
      ctx.emitToSession(channelId, 'chat:cancel_request', {
        channelId,
        targetRequestId,
      });
    }
  });

  socket.on('chat:hook_respond', (payload) => {
    try {
      const { channelId, requestId, response } = chatHookCallbackRespondSchema.parse(payload);
      const channel = ctx.channelManager.get(channelId);
      if (channel) {
        channel.runner.respondToControlRequest(requestId, response);
      }
    } catch {
      // ignore
    }
  });
}
