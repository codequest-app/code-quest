// biome-ignore-all lint/suspicious/noExplicitAny: SocketEvent payload is Record<string,unknown>, needs cast in assertions
import { describe, expect, it } from 'vitest';
import { segments as s } from '../../../test/fake-claude.ts';
import { toSocketEvent } from '../helpers.ts';

describe('transform — stream events', () => {
  it('converts content_block_start to stream:block_start', () => {
    const base = JSON.parse(s.contentBlockStart(0, 'thinking'));
    base.event.content_block = { type: 'thinking', thinking: '', signature: '' };
    base.parent_tool_use_id = null;
    const result = toSocketEvent(JSON.stringify(base));
    expect(result).toMatchObject({
      name: 'stream:block_start',
      payload: { index: 0, blockType: 'thinking' },
    });
    expect((result as any).payload.parentToolUseId).toBeUndefined();
  });

  it('converts content_block_start with parentToolUseId', () => {
    const result = toSocketEvent(s.contentBlockStart(1, 'text', { parentToolUseId: 'toolu_123' }));
    expect(result).toMatchObject({
      name: 'stream:block_start',
      payload: { index: 1, blockType: 'text', parentToolUseId: 'toolu_123' },
    });
  });

  it('converts content_block_start for tool_use block', () => {
    const base = JSON.parse(s.contentBlockStart(2, 'tool_use'));
    base.event.content_block = { type: 'tool_use', id: 'toolu_abc', name: 'Read' };
    const result = toSocketEvent(JSON.stringify(base));
    expect(result).toMatchObject({
      name: 'stream:block_start',
      payload: {
        index: 2,
        blockType: 'tool_use',
        contentBlock: { type: 'tool_use', id: 'toolu_abc', name: 'Read' },
      },
    });
  });

  it('converts text_delta to stream:chunk', () => {
    expect(toSocketEvent(s.textDelta('hello'))).toMatchObject({
      name: 'stream:chunk',
      payload: { chunk: { kind: 'text', content: 'hello' } },
    });
  });

  it('converts thinking_delta', () => {
    expect(toSocketEvent(s.thinkingDelta('hmm'))).toMatchObject({
      name: 'stream:chunk',
      payload: { chunk: { kind: 'thinking', content: 'hmm' } },
    });
  });

  it('converts message_stop to stream:end', () => {
    expect(toSocketEvent(s.messageStop())).toMatchObject({ name: 'stream:end', payload: {} });
  });

  it('skips signature_delta', () => {
    expect(toSocketEvent(s.signatureDelta('sig'))).toBeNull();
  });

  it('skips compaction_delta', () => {
    const raw = JSON.stringify({
      type: 'stream_event',
      event: {
        type: 'content_block_delta',
        index: 0,
        delta: { type: 'compaction_delta', content: 'compressed' },
      },
      session_id: 'x',
      uuid: 'u',
    });
    expect(toSocketEvent(raw)).toBeNull();
  });
});
