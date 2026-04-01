import { terminalGetContentsSchema, terminalOpenClaudeSchema } from '@code-quest/shared';
import type { HandlerContext } from '../context.ts';
import type { TypedSocket } from '../types.ts';
import { errMsg } from '../types.ts';

export function register(socket: TypedSocket, ctx: HandlerContext): void {
  socket.on('terminal:read', (payload, callback) => {
    try {
      const { channelId } = terminalGetContentsSchema.parse(payload);
      const channel = ctx.channelManager.get(channelId);
      if (!channel || channel.terminalLines.length === 0) {
        callback({ content: null });
        return;
      }
      const lines = channel.terminalLines.slice(-100);
      callback({ content: lines.join('\n') });
    } catch {
      callback({ content: null });
    }
  });

  socket.on('terminal:open_claude', async (payload, callback) => {
    try {
      const { channelId, prompt, cwd } = terminalOpenClaudeSchema.parse(payload);
      const existingChannel = ctx.channelManager.get(channelId);
      const baseCwd = cwd ?? (String(existingChannel?.sessionState.cwd ?? '') || process.cwd());

      const newChannelId = crypto.randomUUID();
      const { channel: ch } = await ctx.channelManager.create(newChannelId, {
        onBeforeSpawn: (c) => ctx.channelManager.addSocketToChannel(c, socket),
      });
      ch.updateSessionState({ cwd: baseCwd });

      ctx.io?.emit('session:states', {
        sessions: [{ channelId: newChannelId, state: 'idle' }],
      });

      if (prompt) {
        ch.sendMessage(prompt);
      }

      callback({ success: true, channelId: newChannelId });
    } catch (err) {
      callback({ success: false, error: errMsg(err, 'Failed to open claude terminal') });
    }
  });
}
