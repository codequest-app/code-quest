import { describe, expect, it } from 'vitest';
import { initialChannelState } from '@/types/chat';
import { streamingHandlerOn } from '../streaming.ts';

const onMessageAssistant = streamingHandlerOn['message:assistant'];

describe('message:assistant handler', () => {
  it('includes text block when wasStreamedViaDelta is false', () => {
    const state = { ...initialChannelState('ch'), wasStreamedViaDelta: false };
    const p = { content: [{ type: 'text', text: 'hello' }], channelId: 'ch' };
    const next = onMessageAssistant(state, p as never);
    expect(next.messages).toHaveLength(1);
    expect(next.messages[0]!.type).toBe('text');
    expect(next.messages[0]!.content).toBe('hello');
  });

  it('skips text block when wasStreamedViaDelta is true', () => {
    const state = { ...initialChannelState('ch'), wasStreamedViaDelta: true };
    const p = { content: [{ type: 'text', text: 'hello' }], channelId: 'ch' };
    const next = onMessageAssistant(state, p as never);
    expect(next.messages).toHaveLength(0);
  });

  it('skips thinking block when isThinkingStreaming is true', () => {
    const state = { ...initialChannelState('ch'), isThinkingStreaming: true };
    const p = { content: [{ type: 'thinking', thinking: 'hmm' }], channelId: 'ch' };
    const next = onMessageAssistant(state, p as never);
    expect(next.messages).toHaveLength(0);
  });

  it('resets all streaming flags after processing', () => {
    const state = {
      ...initialChannelState('ch'),
      isTextStreaming: true,
      isThinkingStreaming: true,
      wasStreamedViaDelta: true,
    };
    const p = { content: [], channelId: 'ch' };
    const next = onMessageAssistant(state, p as never);
    expect(next.isTextStreaming).toBe(false);
    expect(next.isThinkingStreaming).toBe(false);
    expect(next.wasStreamedViaDelta).toBe(false);
  });

  it('history case: flags false → all blocks included, reset is no-op', () => {
    const state = initialChannelState('ch'); // all flags false
    const p = {
      content: [
        { type: 'thinking', thinking: 'plan' },
        { type: 'text', text: 'result' },
      ],
      channelId: 'ch',
    };
    const next = onMessageAssistant(state, p as never);
    expect(next.messages).toHaveLength(2);
    expect(next.isTextStreaming).toBe(false);
    expect(next.wasStreamedViaDelta).toBe(false);
  });
});
