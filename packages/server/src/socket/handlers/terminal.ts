import { terminalOpenClaudePayloadSchema } from '@code-quest/shared';
import { logger } from '../../logger.ts';
import type { HandlerContext } from '../../types.ts';
import type { Channel } from '../channel.ts';
import { withChannel } from '../channel-emitter.ts';
import type { SocketCallback, TypedSocket } from '../types.ts';
import { errMsg } from '../utils/helpers.ts';
import { err, ok } from '../utils/rpc.ts';

export function create({
  channelManager,
  emitter,
}: Pick<HandlerContext, 'channelManager' | 'emitter'>): void {
  function handleRead(
    ch: Channel,
    _payload: unknown,
    _socket?: TypedSocket,
    cb?: SocketCallback,
  ): void {
    try {
      if (ch.terminalLines.length === 0) {
        cb?.({ content: null });
        return;
      }
      const lines = ch.terminalLines.slice(-100);
      cb?.({ content: lines.join('\n') });
    } catch (err) {
      logger.warn({ err }, 'Failed to read terminal');
      cb?.({ content: null });
    }
  }

  async function handleOpenClaude(
    _ch: Channel | null,
    payload: unknown,
    socket?: TypedSocket,
    cb?: SocketCallback,
  ): Promise<void> {
    try {
      const { channelId, prompt, cwd } = terminalOpenClaudePayloadSchema.parse(payload);
      const existingChannel = channelManager.get(channelId);
      const baseCwd = cwd ?? existingChannel?.cwd;
      if (!baseCwd) {
        cb?.(err('no cwd available for terminal:open_claude'));
        return;
      }

      const newChannelId = crypto.randomUUID();
      const { channel: ch } = await channelManager.create(newChannelId, {
        cwd: baseCwd,
        onBeforeSpawn: (c) => {
          if (socket) channelManager.addSocketToChannel(c, socket);
        },
      });

      channelManager.broadcastSessionState(newChannelId, 'idle');

      if (prompt) {
        ch.sendMessage(prompt);
      }

      cb?.(ok({ channelId: newChannelId }));
    } catch (e) {
      cb?.(err(errMsg(e, 'Failed to open claude terminal')));
    }
  }

  emitter.on('terminal:read', withChannel(handleRead));
  emitter.on('terminal:open_claude', handleOpenClaude);
}
