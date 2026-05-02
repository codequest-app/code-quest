import type { ClientMessage } from '@code-quest/shared';
import { ClaudeAdapter } from '@code-quest/summoner/browser';
import type { ChannelState } from '@/types/chat';
import { buildMessagesFromHistory } from '@/utils/message';

const adapter = new ClaudeAdapter();

export function buildChannelState(segmentLines: string[]): Partial<ChannelState> {
  const clientMessages: ClientMessage[] = [];

  for (const line of segmentLines) {
    const parsed = adapter.parseLine(line);
    if (parsed.status !== 'ok') continue;
    const output = adapter.transform(parsed.message);
    clientMessages.push(...output.messages);
  }

  return { messages: buildMessagesFromHistory(clientMessages) };
}
