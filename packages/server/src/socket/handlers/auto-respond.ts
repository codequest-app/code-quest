import { autoRespondPayloadSchema } from '@code-quest/shared';
import type { Channel } from '../channel.ts';
import { type ChannelEmitter, withChannel } from '../channel-emitter.ts';

export function create(emitter: ChannelEmitter): void {
  function onAutoRespond(ch: Channel, payload: unknown): void {
    const { requestId, response } = autoRespondPayloadSchema.parse(payload);
    ch.respondToRequest(requestId, response as Record<string, unknown>);
  }

  emitter.on('action:open_url', withChannel(onAutoRespond));
  emitter.on('action:open_file', withChannel(onAutoRespond));
  emitter.on('notification:show', withChannel(onAutoRespond));
  emitter.on('mcp:auto_respond', withChannel(onAutoRespond));
}
