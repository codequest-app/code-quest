import { describe, expect, it } from 'vitest';
import { isDelta } from '../socket/raw-classifier.ts';

describe('isDelta', () => {
  it('returns true for text_delta', () => {
    const raw = JSON.stringify({
      type: 'stream_event',
      event: { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'hi' } },
    });
    expect(isDelta(raw)).toBe(true);
  });

  it('returns true for thinking_delta', () => {
    const raw = JSON.stringify({
      type: 'stream_event',
      event: {
        type: 'content_block_delta',
        index: 0,
        delta: { type: 'thinking_delta', thinking: 'hmm' },
      },
    });
    expect(isDelta(raw)).toBe(true);
  });

  it('returns true for input_json_delta', () => {
    const raw = JSON.stringify({
      type: 'stream_event',
      event: {
        type: 'content_block_delta',
        index: 0,
        delta: { type: 'input_json_delta', partial_json: '{"a":' },
      },
    });
    expect(isDelta(raw)).toBe(true);
  });

  it('returns true for signature_delta', () => {
    const raw = JSON.stringify({
      type: 'stream_event',
      event: {
        type: 'content_block_delta',
        index: 0,
        delta: { type: 'signature_delta', signature: 'sig' },
      },
    });
    expect(isDelta(raw)).toBe(true);
  });

  it('returns true for compaction_delta', () => {
    const raw = JSON.stringify({
      type: 'stream_event',
      event: {
        type: 'content_block_delta',
        index: 0,
        delta: { type: 'compaction_delta', content: 'squish' },
      },
    });
    expect(isDelta(raw)).toBe(true);
  });

  it('returns true for citations_delta', () => {
    const raw = JSON.stringify({
      type: 'stream_event',
      event: {
        type: 'content_block_delta',
        index: 0,
        delta: { type: 'citations_delta', citation: {} },
      },
    });
    expect(isDelta(raw)).toBe(true);
  });

  it('returns false for assistant', () => {
    expect(isDelta('{"type":"assistant","message":{"content":[]}}')).toBe(false);
  });

  it('returns false for user', () => {
    expect(isDelta('{"type":"user","message":{}}')).toBe(false);
  });

  it('returns false for system', () => {
    expect(isDelta('{"type":"system","subtype":"compact_boundary"}')).toBe(false);
  });

  it('returns false for result', () => {
    expect(isDelta('{"type":"result"}')).toBe(false);
  });

  it('returns false for content_block_start', () => {
    expect(isDelta('{"type":"stream_event","event":{"type":"content_block_start"}}')).toBe(false);
  });

  it('returns false for content_block_stop', () => {
    expect(isDelta('{"type":"stream_event","event":{"type":"content_block_stop"}}')).toBe(false);
  });

  it('returns false for message_start', () => {
    expect(isDelta('{"type":"stream_event","event":{"type":"message_start"}}')).toBe(false);
  });

  it('returns false for message_stop', () => {
    expect(isDelta('{"type":"stream_event","event":{"type":"message_stop"}}')).toBe(false);
  });

  it('returns false for message_delta', () => {
    expect(isDelta('{"type":"stream_event","event":{"type":"message_delta"}}')).toBe(false);
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
