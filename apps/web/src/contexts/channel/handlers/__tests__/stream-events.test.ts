import { describe, expect, it } from 'vitest';
import { initialChannelState } from '@/types/chat';
import type { AssistantTurn } from '@/types/ui';
import { streamingHandlerOn } from '../streaming.ts';
import { systemHandlerOn } from '../system.ts';

const onMessageStart = streamingHandlerOn['stream:message_start'];
const onMessageDelta = streamingHandlerOn['stream:message_delta'];
const onBlockStop = streamingHandlerOn['stream:block_stop'];

function lastTurn(state: ReturnType<typeof initialChannelState>): AssistantTurn {
  const last = state.messages[state.messages.length - 1];
  if (!last || last.type !== 'assistant_turn') throw new Error('not assistant_turn');
  return last as AssistantTurn;
}

describe('stream event handlers', () => {
  describe('stream:message_start', () => {
    it('creates an AssistantTurn with usage', () => {
      const state = initialChannelState('ch');
      const next = onMessageStart(state, {
        channelId: 'ch',
        model: 'claude-opus-4-6',
        messageId: 'msg_1',
        usage: { inputTokens: 1000, cacheCreationInputTokens: 500 },
      });
      const turn = lastTurn(next);
      expect(turn.usage).toMatchObject({ inputTokens: 1000 });
    });
  });

  describe('stream:message_delta', () => {
    it('accumulates output tokens on the turn', () => {
      let state = initialChannelState('ch');
      state = onMessageStart(state, {
        channelId: 'ch',
        model: 'claude-opus-4-6',
        messageId: 'msg_1',
        usage: { inputTokens: 1000 },
      });
      const next = onMessageDelta(state, {
        channelId: 'ch',
        stopReason: 'end_turn',
        usage: { outputTokens: 200 },
      });
      expect(lastTurn(next).usage).toMatchObject({ outputTokens: 200 });
    });
  });

  describe('stream:block_stop', () => {
    it('clears streamingToolUseId', () => {
      let state = initialChannelState('ch');
      state = onMessageStart(state, {
        channelId: 'ch',
        model: 'claude-opus-4-6',
        messageId: 'msg_1',
        usage: { inputTokens: 100 },
      });
      state = { ...state, streamingToolUseId: 'toolu_1' };
      const next = onBlockStop(state, { channelId: 'ch', index: 0 });
      expect(next.streamingToolUseId).toBeUndefined();
    });
  });

  describe('stream:compaction', () => {
    const handler = streamingHandlerOn['stream:compaction'];

    it('adds a compact_boundary message', () => {
      const state = initialChannelState('ch');
      const next = handler(state, { channelId: 'ch', content: 'compressed context' });
      expect(next.messages).toHaveLength(1);
      expect(next.messages[0]!.type).toBe('compact_boundary');
    });
  });

  describe('system:post_turn_summary', () => {
    const handler = systemHandlerOn['system:post_turn_summary'];

    it('adds a post_turn_summary message', () => {
      const state = initialChannelState('ch');
      const next = handler(state, {
        channelId: 'ch',
        summary: 'User asked about auth.',
      });
      expect(next.messages).toHaveLength(1);
      expect(next.messages[0]!.content).toBe('User asked about auth.');
    });
  });
});
