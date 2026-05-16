import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { rpcResult } from '../rpc.ts';

describe('rpcResult schema builder', () => {
  const dataSchema = z.object({ channelId: z.string(), count: z.number() });
  const schema = rpcResult(dataSchema);

  it('accepts ok result with matching data', () => {
    const raw = { ok: true, data: { channelId: 'ch-1', count: 42 } };
    const parsed = schema.safeParse(raw);
    expect(parsed.success).toBe(true);
    if (parsed.success && parsed.data.ok) {
      expect(parsed.data.data.channelId).toBe('ch-1');
      expect(parsed.data.data.count).toBe(42);
    }
  });

  it('accepts err result with string message', () => {
    const raw = { ok: false, error: 'something broke' };
    const parsed = schema.safeParse(raw);
    expect(parsed.success).toBe(true);
    if (parsed.success && !parsed.data.ok) {
      expect(parsed.data.error).toBe('something broke');
      expect(parsed.data.code).toBeUndefined();
    }
  });

  it('accepts err result with optional code', () => {
    const raw = { ok: false, error: 'not found', code: 'session_missing' };
    const parsed = schema.safeParse(raw);
    expect(parsed.success).toBe(true);
    if (parsed.success && !parsed.data.ok) {
      expect(parsed.data.code).toBe('session_missing');
    }
  });

  it('rejects legacy success shape', () => {
    const raw = { success: true, channelId: 'ch-1' };
    expect(schema.safeParse(raw).success).toBe(false);
  });

  it('rejects ok result with wrong data shape', () => {
    const raw = { ok: true, data: { channelId: 123 } };
    expect(schema.safeParse(raw).success).toBe(false);
  });

  it('rejects err result without error message', () => {
    expect(schema.safeParse({ ok: false }).success).toBe(false);
  });
});
