import { terminalGetContentsSchema, terminalOpenClaudeSchema } from '@code-quest/shared';
import type { ChannelManager } from '../channel-manager.ts';
import type { SocketCallback, SocketHandler, TypedSocket } from '../types.ts';
import { errMsg } from '../utils/helpers.ts';

export function create(channelManager: ChannelManager): SocketHandler {
  function handleRead(payload: unknown, callback: SocketCallback): void {
    try {
      const { channelId } = terminalGetContentsSchema.parse(payload);
      const channel = channelManager.get(channelId);
      if (!channel || channel.terminalLines.length === 0) {
        callback({ content: null });
        return;
      }
      const lines = channel.terminalLines.slice(-100);
      callback({ content: lines.join('\n') });
    } catch {
      callback({ content: null });
    }
  }

  async function handleOpenClaude(
    socket: TypedSocket,
    payload: unknown,
    callback: SocketCallback,
  ): Promise<void> {
    try {
      const { channelId, prompt, cwd } = terminalOpenClaudeSchema.parse(payload);
      const existingChannel = channelManager.get(channelId);
      const baseCwd = cwd ?? (String(existingChannel?.sessionState.cwd ?? '') || process.cwd());

      const newChannelId = crypto.randomUUID();
      const { channel: ch } = await channelManager.create(newChannelId, {
        onBeforeSpawn: (c) => channelManager.addSocketToChannel(c, socket),
      });
      ch.updateSessionState({ cwd: baseCwd });

      channelManager.broadcastSessionState(newChannelId, 'idle');

      if (prompt) {
        ch.sendMessage(prompt);
      }

      callback({ success: true, channelId: newChannelId });
    } catch (err) {
      callback({ success: false, error: errMsg(err, 'Failed to open claude terminal') });
    }
  }

  return {
    register(socket: TypedSocket) {
      socket.on('terminal:read', (p, cb) => handleRead(p, cb));
      socket.on('terminal:open_claude', (p, cb) => handleOpenClaude(socket, p, cb));
    },
  };
}
