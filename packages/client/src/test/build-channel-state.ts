import type { ClientMessage } from '@code-quest/shared';
import { ClaudeAdapter } from '@code-quest/summoner';
import type { ChannelState } from '@/types/chat';
import { buildMessagesFromHistory } from '@/utils/message';

const adapter = new ClaudeAdapter();

/**
 * Run a sequence of raw segment strings through the real ClaudeAdapter pipeline
 * and produce a ChannelState-compatible partial for Storybook stories.
 *
 * Usage:
 *   withScenario(buildChannelState([
 *     segments.init('s1'),
 *     segments.assistant('Hello'),
 *     segments.result(),
 *   ]))
 */
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
