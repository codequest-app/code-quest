import { describe, expect, it } from 'vitest';
import { isDelta } from '../socket/raw-classifier.ts';

describe('isDelta', () => {
  const deltaSubtypes = [
    { type: 'text_delta', text: 'hi' },
    { type: 'thinking_delta', thinking: 'hmm' },
    { type: 'input_json_delta', partial_json: '{"a":' },
    { type: 'signature_delta', signature: 'sig' },
    { type: 'compaction_delta', content: 'squish' },
    { type: 'citations_delta', citation: {} },
  ];

  for (const delta of deltaSubtypes) {
    it(`returns true for ${delta.type}`, () => {
      const raw = JSON.stringify({
        type: 'stream_event',
        event: { type: 'content_block_delta', index: 0, delta },
      });
      expect(isDelta(raw)).toBe(true);
    });
  }

  it.each([
    ['assistant', '{"type":"assistant","message":{"content":[]}}'],
    ['user', '{"type":"user","message":{}}'],
    ['system', '{"type":"system","subtype":"compact_boundary"}'],
    ['result', '{"type":"result"}'],
    ['content_block_start', '{"type":"stream_event","event":{"type":"content_block_start"}}'],
    ['content_block_stop', '{"type":"stream_event","event":{"type":"content_block_stop"}}'],
    ['message_start', '{"type":"stream_event","event":{"type":"message_start"}}'],
    ['message_stop', '{"type":"stream_event","event":{"type":"message_stop"}}'],
    ['message_delta', '{"type":"stream_event","event":{"type":"message_delta"}}'],
  ])('returns false for %s', (_name, raw) => {
    expect(isDelta(raw)).toBe(false);
  });

  it('returns false for malformed JSON', () => {
    expect(isDelta('{not-json')).toBe(false);
    expect(isDelta('')).toBe(false);
  });

  it('returns false for JSON array / primitives', () => {
    expect(isDelta('[1,2,3]')).toBe(false);
    expect(isDelta('"hello"')).toBe(false);
    expect(isDelta('null')).toBe(false);
  });
});
