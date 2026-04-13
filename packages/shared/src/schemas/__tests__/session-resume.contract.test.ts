/**
 * Contract test: schemas added for project-menu-resume.
 *   - sessionResumePayloadSchema     C2S RPC payload
 *   - sessionResumeResponseSchema    server ack shape (discriminated union on `ok`)
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

describe('sessionResumeResponseSchema (discriminated union)', () => {
  it('accepts success { ok: true, channelId }', () => {
    const result = sessionResumeResponseSchema.safeParse({ ok: true, channelId: 'ch-1' });
    expect(result.success).toBe(true);
  });

  it('accepts failure { ok: false, error }', () => {
    const result = sessionResumeResponseSchema.safeParse({ ok: false, error: 'boom' });
    expect(result.success).toBe(true);
  });

  it('rejects empty object {} (must carry ok)', () => {
    const result = sessionResumeResponseSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects success without channelId', () => {
    const result = sessionResumeResponseSchema.safeParse({ ok: true });
    expect(result.success).toBe(false);
  });

  it('rejects failure without error', () => {
    const result = sessionResumeResponseSchema.safeParse({ ok: false });
    expect(result.success).toBe(false);
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
