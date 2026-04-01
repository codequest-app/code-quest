import type { ChannelManager } from '../channel-manager.ts';
import type { SocketHandler, TypedSocket } from '../types.ts';

export function create(channelManager: ChannelManager): SocketHandler {
  function handleStart(payload: { channelId: string }): void {
    const channel = channelManager.get(payload.channelId);
    if (!channel) return;
    channel.write(JSON.stringify({ type: 'start_speech_to_text', channelId: payload.channelId }));
  }

  function handleStop(payload: { channelId: string }): void {
    const channel = channelManager.get(payload.channelId);
    if (!channel) return;
    channel.write(JSON.stringify({ type: 'stop_speech_to_text', channelId: payload.channelId }));
  }

  return {
    register(socket: TypedSocket) {
      socket.on('speech:start', handleStart);
      socket.on('speech:stop', handleStop);
    },
  };
}
