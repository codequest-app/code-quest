import type { ChatStats } from '@code-quest/shared';
import type { Message } from '../types/ui';

export const msg = (fields: Omit<Message, 'id' | 'timestamp'>): Message => ({
  id: crypto.randomUUID(),
  timestamp: Date.now(),
  ...fields,
});

interface SocketEvent {
  name: string;
  payload: Record<string, unknown>;
}

export function buildMessagesFromHistory(events: SocketEvent[]): Message[] {
  const messages: Message[] = [];
  for (const event of events) {
    if (event.name === 'message:assistant') {
      const content = event.payload.content as Array<Record<string, unknown>>;
      const parentToolUseId = event.payload.parentToolUseId as string | undefined;
      for (const block of content) {
        if (block.type === 'text') {
          messages.push(
            msg({
              role: 'assistant',
              type: 'text',
              content: block.text as string,
              parentToolUseId,
            }),
          );
        } else if (block.type === 'thinking') {
          messages.push(
            msg({
              role: 'assistant',
              type: 'thinking',
              content: block.thinking as string,
            }),
          );
        } else if (block.type === 'tool_use') {
          messages.push(
            msg({
              role: 'assistant',
              type: 'tool_use',
              content: block.toolName as string,
              meta: { toolId: block.toolId as string, input: block.input },
              parentToolUseId,
            }),
          );
        }
      }
    } else if (event.name === 'message:user') {
      const content = event.payload.content as Array<Record<string, unknown>>;
      const parentToolUseId = event.payload.parentToolUseId as string | undefined;
      for (const block of content) {
        if (block.type === 'tool_result') {
          messages.push(
            msg({
              role: 'assistant',
              type: 'tool_result',
              content: String(block.content ?? ''),
              meta: {
                toolId: block.toolUseId as string,
                name: block.toolName as string | undefined,
              },
              parentToolUseId,
            }),
          );
        } else if (block.type === 'text') {
          messages.push(msg({ role: 'user', type: 'text', content: block.text as string }));
        }
      }
    } else if (event.name === 'message:result') {
      const eventStats = event.payload.stats as Record<string, unknown>;
      const stats: ChatStats = {
        costUsd: eventStats.totalCostUsd as number | undefined,
        durationMs: eventStats.durationMs as number | undefined,
        inputTokens: eventStats.inputTokens as number | undefined,
        outputTokens: eventStats.outputTokens as number | undefined,
        numTurns: eventStats.numTurns as number | undefined,
        modelUsage: eventStats.modelUsage as ChatStats['modelUsage'],
      };
      messages.push(msg({ role: 'system', type: 'result', content: '', meta: { stats } }));
    }
  }
  return messages;
}
