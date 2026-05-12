import { describe, expect, it } from 'vitest';
import { initialChannelState } from '@/types/chat';
import type { AssistantTurn } from '@/types/ui';
import { streamingHandlerOn } from '../streaming.ts';

const onMessageAssistant = streamingHandlerOn['message:assistant'];

function lastTurn(state: ReturnType<typeof initialChannelState>): AssistantTurn {
  const last = state.messages[state.messages.length - 1];
  if (!last || last.type !== 'assistant_turn') throw new Error('not assistant_turn');
  return last as AssistantTurn;
}

describe('message:assistant handler', () => {
  it('replay: creates AssistantTurn with text block', () => {
    const state = initialChannelState('ch');
    const p = { content: [{ type: 'text', text: 'hello' }], channelId: 'ch' };
    const next = onMessageAssistant(state, p as never);
    expect(next.messages).toHaveLength(1);
    const turn = lastTurn(next);
    expect(turn.blocks).toHaveLength(1);
    expect(turn.blocks[0]!.type).toBe('text');
    expect(turn.blocks[0]!.content).toBe('hello');
  });

  it('replay: creates AssistantTurn with all blocks', () => {
    const state = initialChannelState('ch');
    const p = {
      content: [
        { type: 'thinking', thinking: 'plan' },
        { type: 'text', text: 'result' },
      ],
      channelId: 'ch',
    };
    const next = onMessageAssistant(state, p as never);
    expect(next.messages).toHaveLength(1);
    const turn = lastTurn(next);
    expect(turn.blocks).toHaveLength(2);
    expect(turn.blocks[0]!.type).toBe('thinking');
    expect(turn.blocks[0]!.content).toBe('plan');
    expect(turn.blocks[1]!.type).toBe('text');
    expect(turn.blocks[1]!.content).toBe('result');
    expect(turn.isStreaming).toBe(false);
  });

  it('replay: empty content creates AssistantTurn with no blocks', () => {
    const state = initialChannelState('ch');
    const p = { content: [], channelId: 'ch' };
    const next = onMessageAssistant(state, p as never);
    expect(next.messages).toHaveLength(1);
    const turn = lastTurn(next);
    expect(turn.blocks).toHaveLength(0);
  });
});
