import { terminalOpenClaudePayloadSchema } from '@code-quest/shared';
import { logger } from '../../logger.ts';
import type { Channel } from '../channel.ts';
import { type ChannelEmitter, withChannel } from '../channel-emitter.ts';
import type { ChannelManager } from '../channel-manager.ts';
import type { SocketCallback, TypedSocket } from '../types.ts';
import { errMsg } from '../utils/helpers.ts';

export function create(channelManager: ChannelManager, emitter: ChannelEmitter): void {
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

      const newChannelId = crypto.randomUUID();
      const { channel: ch } = await channelManager.create(newChannelId, {
        onBeforeSpawn: (c) => {
          if (socket) channelManager.addSocketToChannel(c, socket);
        },
      });
      ch.cwd = baseCwd;

      channelManager.broadcastSessionState(newChannelId, 'idle');

      if (prompt) {
        ch.sendMessage(prompt);
      }

      cb?.({ success: true, channelId: newChannelId });
    } catch (err) {
      cb?.({ success: false, error: errMsg(err, 'Failed to open claude terminal') });
    }
  }

  emitter.on('terminal:read', withChannel(handleRead));
  emitter.on('terminal:open_claude', handleOpenClaude);
}
