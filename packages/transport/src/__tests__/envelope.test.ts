import { describe, expect, it } from 'vitest';
import { EnvelopeSchema, parseEnvelope } from '../envelope.ts';

describe('EnvelopeSchema', () => {
  describe('round-trip parse for each kind', () => {
    it('event', () => {
      const env = { kind: 'event', seq: 1, event: 'chat:send', data: { text: 'hi' } };
      expect(EnvelopeSchema.parse(env)).toEqual(env);
    });

    it('request with data', () => {
      const env = { kind: 'request', id: 'r-1', event: 'session:launch', data: { cwd: '/tmp' } };
      expect(EnvelopeSchema.parse(env)).toEqual(env);
    });

    it('request without data', () => {
      // data is optional — JSON.stringify silently drops undefined fields on the wire.
      const env = { kind: 'request', id: 'r-2', event: 'app:init' };
      expect(EnvelopeSchema.parse(env)).toEqual(env);
    });

    it('response ok', () => {
      const env = { kind: 'response', id: 'r-1', ok: true, data: { channelId: 'c-1' } };
      expect(EnvelopeSchema.parse(env)).toEqual(env);
    });

    it('response err', () => {
      const env = { kind: 'response', id: 'r-1', ok: false, error: 'boom' };
      expect(EnvelopeSchema.parse(env)).toEqual(env);
    });

    it('ping', () => {
      const env = { kind: 'ping' };
      expect(EnvelopeSchema.parse(env)).toEqual(env);
    });

    it('pong', () => {
      const env = { kind: 'pong' };
      expect(EnvelopeSchema.parse(env)).toEqual(env);
    });

    it('resume', () => {
      const env = { kind: 'resume', lastSeq: 42 };
      expect(EnvelopeSchema.parse(env)).toEqual(env);
    });
  });

  describe('rejects malformed envelopes', () => {
    it('missing kind', () => {
      expect(EnvelopeSchema.safeParse({ event: 'foo', data: {} }).success).toBe(false);
    });

    it('unknown kind', () => {
      expect(EnvelopeSchema.safeParse({ kind: 'broadcast', data: {} }).success).toBe(false);
    });

    it('event without seq', () => {
      expect(EnvelopeSchema.safeParse({ kind: 'event', event: 'x', data: {} }).success).toBe(false);
    });

    it('request without id', () => {
      expect(EnvelopeSchema.safeParse({ kind: 'request', event: 'x', data: {} }).success).toBe(
        false,
      );
    });

    it('response without ok', () => {
      expect(EnvelopeSchema.safeParse({ kind: 'response', id: 'r-1' }).success).toBe(false);
    });
  });

  describe('seq constraint on event', () => {
    it('accepts non-negative integer seq', () => {
      expect(
        EnvelopeSchema.safeParse({ kind: 'event', seq: 0, event: 'x', data: {} }).success,
      ).toBe(true);
      expect(
        EnvelopeSchema.safeParse({ kind: 'event', seq: 1, event: 'x', data: {} }).success,
      ).toBe(true);
    });

    it('rejects negative seq', () => {
      expect(
        EnvelopeSchema.safeParse({ kind: 'event', seq: -1, event: 'x', data: {} }).success,
      ).toBe(false);
    });

    it('rejects non-integer seq', () => {
      expect(
        EnvelopeSchema.safeParse({ kind: 'event', seq: 1.5, event: 'x', data: {} }).success,
      ).toBe(false);
    });
  });

  describe('lastSeq constraint on resume', () => {
    it('accepts non-negative integer lastSeq', () => {
      expect(EnvelopeSchema.safeParse({ kind: 'resume', lastSeq: 0 }).success).toBe(true);
    });

    it('rejects negative lastSeq', () => {
      expect(EnvelopeSchema.safeParse({ kind: 'resume', lastSeq: -1 }).success).toBe(false);
    });
  });
});

describe('parseEnvelope', () => {
  it('parses valid JSON envelope', () => {
    const raw = JSON.stringify({ kind: 'ping' });
    expect(parseEnvelope(raw)).toEqual({ kind: 'ping' });
  });

  it('returns null for invalid JSON', () => {
    expect(parseEnvelope('not-json')).toBeNull();
  });

  it('returns null for non-object JSON', () => {
    expect(parseEnvelope('"hello"')).toBeNull();
  });

  it('returns null for object without kind', () => {
    expect(parseEnvelope('{"event":"foo"}')).toBeNull();
  });

  it('returns null for unknown kind', () => {
    expect(parseEnvelope('{"kind":"unknown"}')).toBeNull();
  });

  it('parses event envelope', () => {
    const env = { kind: 'event', seq: 1, event: 'test', data: { x: 1 } };
    expect(parseEnvelope(JSON.stringify(env))).toEqual(env);
  });

  it('parses request envelope without data field', () => {
    // Regression: app:init arrived without data and parseEnvelope returned null,
    // silently swallowing the request. Root cause: data was required in the schema.
    const raw = '{"kind":"request","id":"r-1","event":"app:init"}';
    expect(parseEnvelope(raw)).toEqual({ kind: 'request', id: 'r-1', event: 'app:init' });
  });
});
