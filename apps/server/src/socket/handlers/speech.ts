import { EVENTS } from '@code-quest/schemas';
import type { HandlerContext } from '../../types.ts';
import type { Channel } from '../channel.ts';
import { withChannel } from '../channel-emitter.ts';

export function create({ emitter }: Pick<HandlerContext, 'emitter'>): void {
  function handleStart(ch: Channel, _payload: unknown): void {
    ch.write(JSON.stringify({ type: 'start_speech_to_text', channelId: ch.channelId }));
  }

  function handleStop(ch: Channel, _payload: unknown): void {
    ch.write(JSON.stringify({ type: 'stop_speech_to_text', channelId: ch.channelId }));
  }

  emitter.on(EVENTS.speech.start, withChannel(handleStart));
  emitter.on(EVENTS.speech.stop, withChannel(handleStop));
}
