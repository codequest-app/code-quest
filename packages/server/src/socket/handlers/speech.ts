import type { HandlerContext } from '../context.ts';
import type { TypedSocket } from '../types.ts';

export function register(socket: TypedSocket, ctx: HandlerContext): void {
  socket.on('speech:start', (payload) => {
    const channel = ctx.channelManager.get(payload.channelId);
    if (!channel) return;
    channel.write(JSON.stringify({ type: 'start_speech_to_text', channelId: payload.channelId }));
  });

  socket.on('speech:stop', (payload) => {
    const channel = ctx.channelManager.get(payload.channelId);
    if (!channel) return;
    channel.write(JSON.stringify({ type: 'stop_speech_to_text', channelId: payload.channelId }));
  });
}
