import { describe, expect, it } from 'vitest';
import { messageUserPayloadSchema } from '../message-payloads.ts';

describe('messageUserPayloadSchema', () => {
  const base = { channelId: 'c1', content: [{ type: 'text', text: 'hi' }] as const };

  it('accepts payload without history or renderAs', () => {
    const r = messageUserPayloadSchema.safeParse(base);
    expect(r.success).toBe(true);
  });

  it('accepts history: true', () => {
    const r = messageUserPayloadSchema.safeParse({ ...base, history: true });
    expect(r.success).toBe(true);
  });

  it('accepts renderAs: plain', () => {
    const r = messageUserPayloadSchema.safeParse({ ...base, renderAs: 'plain' });
    expect(r.success).toBe(true);
  });

  it('accepts renderAs: markdown', () => {
    const r = messageUserPayloadSchema.safeParse({ ...base, renderAs: 'markdown' });
    expect(r.success).toBe(true);
  });

  it('rejects unknown renderAs values', () => {
    const r = messageUserPayloadSchema.safeParse({ ...base, renderAs: 'html' });
    expect(r.success).toBe(false);
  });

  it('ignores unknown fields (source no longer valid)', () => {
    const r = messageUserPayloadSchema.safeParse({ ...base, source: 'typed' });
    expect(r.success).toBe(true);
  });
});
