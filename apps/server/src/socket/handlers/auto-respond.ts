import { autoRespondPayloadSchema, EVENTS } from '@code-quest/schemas';
import type { HandlerContext } from '../../types.ts';
import type { Channel } from '../channel.ts';
import { withChannel } from '../channel-emitter.ts';

export function create({ emitter }: Pick<HandlerContext, 'emitter'>): void {
  function onAutoRespond(ch: Channel, payload: unknown): void {
    const { requestId, response } = autoRespondPayloadSchema.parse(payload);
    ch.respondToRequest(requestId, response);
  }

  emitter.on(EVENTS.action.open_url, withChannel(onAutoRespond));
  emitter.on(EVENTS.action.open_file, withChannel(onAutoRespond));
  emitter.on(EVENTS.notification.show, withChannel(onAutoRespond));
  emitter.on(EVENTS.mcp.auto_respond, withChannel(onAutoRespond));
}
