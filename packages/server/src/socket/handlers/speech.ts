import type { HandlerContext } from '../../types.ts';
import type { Channel } from '../channel.ts';
import { withChannel } from '../channel-emitter.ts';

export function create({ emitter }: Pick<HandlerContext, 'emitter'>): void {
  function handleStart(ch: Channel, _payload: unknown): void {
    ch.write(JSON.stringify({ type: 'start_speech_to_text', channelId: ch.id }));
  }

  function handleStop(ch: Channel, _payload: unknown): void {
    ch.write(JSON.stringify({ type: 'stop_speech_to_text', channelId: ch.id }));
  }

  emitter.on('speech:start', withChannel(handleStart));
  emitter.on('speech:stop', withChannel(handleStop));
}
