import {
  controlResponseSchema,
  sessionListResponseSchema,
  successResponseSchema,
} from '@code-quest/shared';
import { describe, expect, it } from 'vitest';

describe('shared response schemas', () => {
  describe('successResponseSchema', () => {
    it('accepts { success: true }', () => {
      expect(successResponseSchema.parse({ success: true })).toEqual({ success: true });
    });

    it('accepts { success: false, error: "msg" }', () => {
      expect(successResponseSchema.parse({ success: false, error: 'fail' })).toEqual({
        success: false,
        error: 'fail',
      });
    });

    it('rejects missing success', () => {
      expect(() => successResponseSchema.parse({})).toThrow();
    });
  });

  describe('controlResponseSchema', () => {
    it('accepts { success: true, response: { key: "val" } }', () => {
      const input = { success: true, response: { key: 'val' } };
      expect(controlResponseSchema.parse(input)).toEqual(input);
    });

    it('accepts { success: false, error: "err" }', () => {
      expect(controlResponseSchema.parse({ success: false, error: 'err' })).toEqual({
        success: false,
        error: 'err',
      });
    });

    it('accepts success without response', () => {
      expect(controlResponseSchema.parse({ success: true })).toEqual({ success: true });
    });
  });

  describe('sessionListResponseSchema', () => {
    it('accepts { sessions: [], total: 0 }', () => {
      expect(sessionListResponseSchema.parse({ sessions: [], total: 0 })).toEqual({
        sessions: [],
        total: 0,
      });
    });

    it('accepts sessions with summary objects', () => {
      const input = {
        sessions: [
          {
            channelId: 's1',
            provider: 'claude',
            command: 'claude',
            args: '[]',
            mode: 'interactive',
            role: 'chat',
            createdAt: '2025-01-01',
          },
        ],
        total: 1,
      };
      const result = sessionListResponseSchema.parse(input);
      expect(result.sessions).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('rejects missing total', () => {
      expect(() => sessionListResponseSchema.parse({ sessions: [] })).toThrow();
    });
  });
});
