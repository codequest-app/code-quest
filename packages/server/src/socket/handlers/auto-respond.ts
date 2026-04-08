import { autoRespondPayloadSchema } from '@code-quest/shared';
import type { HandlerContext } from '../../types.ts';
import type { Channel } from '../channel.ts';
import { withChannel } from '../channel-emitter.ts';

export function create({ emitter }: Pick<HandlerContext, 'emitter'>): void {
  function onAutoRespond(ch: Channel, payload: unknown): void {
    const { requestId, response } = autoRespondPayloadSchema.parse(payload);
    ch.respondToRequest(requestId, response);
  }

  emitter.on('action:open_url', withChannel(onAutoRespond));
  emitter.on('action:open_file', withChannel(onAutoRespond));
  emitter.on('notification:show', withChannel(onAutoRespond));
  emitter.on('mcp:auto_respond', withChannel(onAutoRespond));
}
