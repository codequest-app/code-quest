import { describe, expect, it } from 'vitest';
import { messageUserPayloadSchema } from '../message-payloads.ts';

describe('messageUserPayloadSchema.source', () => {
  const base = { channelId: 'c1', content: [{ type: 'text', text: 'hi' }] as const };

  it('accepts each valid source value', () => {
    for (const source of ['typed', 'skill', 'command', 'reminder'] as const) {
      const r = messageUserPayloadSchema.safeParse({ ...base, source });
      expect(r.success).toBe(true);
    }
  });

  it('accepts payload without source (treated as default)', () => {
    const r = messageUserPayloadSchema.safeParse(base);
    expect(r.success).toBe(true);
  });

  it('rejects unknown source values', () => {
    const r = messageUserPayloadSchema.safeParse({ ...base, source: 'tool_result' });
    expect(r.success).toBe(false);
  });
});
