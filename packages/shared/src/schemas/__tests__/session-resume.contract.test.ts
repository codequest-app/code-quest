/**
 * Contract test: schemas added for project-menu-resume.
 *   - sessionResumePayloadSchema     C2S RPC payload
 *   - sessionResumeResponseSchema    server ack shape
 *   - sessionListPayloadSchema       gains optional excludeLive flag
 */
import { describe, expect, it } from 'vitest';
import {
  sessionListPayloadSchema,
  sessionResumePayloadSchema,
  sessionResumeResponseSchema,
} from '../session.ts';

describe('sessionResumePayloadSchema', () => {
  it('accepts { sessionId }', () => {
    const result = sessionResumePayloadSchema.safeParse({ sessionId: 'abc' });
    expect(result.success).toBe(true);
  });

  it('rejects missing sessionId', () => {
    const result = sessionResumePayloadSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('sessionResumeResponseSchema', () => {
  it('accepts { channelId }', () => {
    const result = sessionResumeResponseSchema.safeParse({ channelId: 'ch-1' });
    expect(result.success).toBe(true);
  });

  it('accepts { error }', () => {
    const result = sessionResumeResponseSchema.safeParse({ error: 'boom' });
    expect(result.success).toBe(true);
  });

  it('accepts {} (server may emit empty for transient states)', () => {
    const result = sessionResumeResponseSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe('sessionListPayloadSchema excludeLive', () => {
  it('accepts excludeLive: true', () => {
    const result = sessionListPayloadSchema.safeParse({ excludeLive: true });
    expect(result.success).toBe(true);
  });

  it('default parse leaves excludeLive undefined', () => {
    const result = sessionListPayloadSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.excludeLive).toBeUndefined();
  });
});
