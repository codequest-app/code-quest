import type { SocketCallback, TypedSocket } from '@code-quest/schemas';
import { EVENTS, errMsg, terminalOpenClaudePayloadSchema } from '@code-quest/schemas';
import { logger } from '../../logger.ts';
import type { HandlerContext } from '../../types.ts';
import type { Channel } from '../channel.ts';
import { withChannel } from '../channel-emitter.ts';
import { err, ok } from '../utils/rpc.ts';

const TERMINAL_MAX_LINES = 100;

export function create({
  channelManager,
  emitter,
}: Pick<HandlerContext, 'channelManager' | 'emitter'>): void {
  function handleRead(
    ch: Channel,
    _payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): void {
    try {
      if (ch.terminalLines.length === 0) {
        callback?.({ content: null });
        return;
      }
      const lines = ch.terminalLines.slice(-TERMINAL_MAX_LINES);
      callback?.({ content: lines.join('\n') });
    } catch (err) {
      logger.warn({ err }, 'Failed to read terminal');
      callback?.({ content: null });
    }
  }

  /** Pick an explicit cwd from the payload, else fall back to the cwd of an
   *  existing channel on the same id. Returns null when neither is available. */
  function resolveTerminalCwd(explicitCwd: string | undefined, channelId: string): string | null {
    if (explicitCwd) return explicitCwd;
    return channelManager.get(channelId)?.cwd ?? null;
  }

  async function spawnTerminalChannel(
    baseCwd: string,
    socket: TypedSocket | undefined,
  ): Promise<{ channel: Channel; channelId: string }> {
    const channelId = crypto.randomUUID();
    const { channel } = await channelManager.create(channelId, {
      cwd: baseCwd,
      onBeforeSpawn: (c) => {
        if (socket) channelManager.addSocketToChannel(c, socket);
      },
    });
    channelManager.broadcastSessionState(channelId, 'idle');
    return { channel, channelId };
  }

  async function handleOpenClaude(
    _ch: Channel | null,
    payload: unknown,
    socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    try {
      const { channelId, prompt, cwd } = terminalOpenClaudePayloadSchema.parse(payload);
      const baseCwd = resolveTerminalCwd(cwd, channelId);
      if (!baseCwd) {
        callback?.(err('no cwd available for terminal:open_claude'));
        return;
      }

      const { channel, channelId: newChannelId } = await spawnTerminalChannel(baseCwd, socket);
      if (prompt) channel.sendMessage(prompt);
      callback?.(ok({ channelId: newChannelId }));
    } catch (e) {
      callback?.(err(errMsg(e, 'Failed to open claude terminal')));
    }
  }

  emitter.on(EVENTS.terminal.read, withChannel(handleRead));
  emitter.on(EVENTS.terminal.open_claude, handleOpenClaude);
}
