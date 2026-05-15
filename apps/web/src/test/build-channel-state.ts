import type { ClientMessage } from '@code-quest/schemas';
import { ClaudeAdapter } from '@code-quest/summoner/browser';
import { messageHandlers } from '@/contexts/channel/handlers/handler-sets';
import { type ChannelState, initialChannelState } from '@/types/chat';

const adapter = new ClaudeAdapter();

export function buildChannelState(segmentLines: string[]): Partial<ChannelState> {
  const clientMessages: ClientMessage[] = [];

  for (const line of segmentLines) {
    const parsed = adapter.parseLine(line);
    if (parsed.status !== 'ok') continue;
    const output = adapter.transform(parsed.message);
    clientMessages.push(...output.messages);
  }

  const initial = initialChannelState('history');
  const final = clientMessages.reduce((state, event) => {
    const handler = messageHandlers[event.name];
    return handler ? handler(state, event.payload as never) : state;
  }, initial);

  return { messages: final.messages };
}
