import type { Channel } from '../channel.ts';
import { type ChannelEmitter, withChannel } from '../channel-emitter.ts';

export function create(emitter: ChannelEmitter): void {
  function onAutoRespond(ch: Channel, payload: unknown): void {
    const { requestId, response } = payload as {
      requestId: string;
      response: Record<string, unknown>;
    };
    if (!requestId || !response) return;
    ch.respondToRequest(requestId, response);
  }

  emitter.on('action:open_url', withChannel(onAutoRespond));
  emitter.on('action:open_file', withChannel(onAutoRespond));
  emitter.on('notification:show', withChannel(onAutoRespond));
  emitter.on('mcp:auto_respond', withChannel(onAutoRespond));
}
