import { describe, expect, it } from 'vitest';
import { updateStatePayloadSchema } from '../settings.ts';

describe('updateStatePayloadSchema', () => {
  describe('fastModeState', () => {
    it('accepts "on"', () => {
      const result = updateStatePayloadSchema.safeParse({ channelId: 'ch', fastModeState: 'on' });
      expect(result.success).toBe(true);
      expect(result.data?.fastModeState).toBe('on');
    });

    it('accepts "off"', () => {
      const result = updateStatePayloadSchema.safeParse({ channelId: 'ch', fastModeState: 'off' });
      expect(result.success).toBe(true);
      expect(result.data?.fastModeState).toBe('off');
    });

    it('accepts null', () => {
      const result = updateStatePayloadSchema.safeParse({ channelId: 'ch', fastModeState: null });
      expect(result.success).toBe(true);
      expect(result.data?.fastModeState).toBeNull();
    });

    it('accepts undefined (field omitted)', () => {
      const result = updateStatePayloadSchema.safeParse({ channelId: 'ch' });
      expect(result.success).toBe(true);
      expect(result.data?.fastModeState).toBeUndefined();
    });

    it('rejects arbitrary strings like "enabled"', () => {
      const result = updateStatePayloadSchema.safeParse({
        channelId: 'ch',
        fastModeState: 'enabled',
      });
      expect(result.success).toBe(false);
    });
  });
});
