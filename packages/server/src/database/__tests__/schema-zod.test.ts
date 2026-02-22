import { describe, expect, it } from 'vitest';
import { insertEventSchema, insertSessionSchema } from '../schema-zod.ts';

describe('schema-zod', () => {
  describe('insertSessionSchema', () => {
    it('should validate a valid session row', () => {
      const result = insertSessionSchema.safeParse({
        id: 'session-1',
        provider: 'claude',
        command: 'claude',
        args: '["--verbose"]',
        cwd: '/tmp',
        mode: 'interactive',
        createdAt: '2026-01-01T00:00:00.000Z',
      });
      expect(result.success).toBe(true);
    });

    it('should allow null cwd', () => {
      const result = insertSessionSchema.safeParse({
        id: 's1',
        provider: 'claude',
        command: 'claude',
        args: '[]',
        cwd: null,
        mode: 'print',
        createdAt: '2026-01-01T00:00:00.000Z',
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing required fields', () => {
      const result = insertSessionSchema.safeParse({ id: 's1' });
      expect(result.success).toBe(false);
    });

    it('should validate session with role and parentId', () => {
      const result = insertSessionSchema.safeParse({
        id: 's1',
        provider: 'claude',
        command: 'claude',
        args: '[]',
        mode: 'print',
        role: 'worker',
        parentId: 'orch-1',
        createdAt: '2026-01-01T00:00:00.000Z',
      });
      expect(result.success).toBe(true);
    });

    it('should accept session without role (optional with SQL default)', () => {
      const result = insertSessionSchema.safeParse({
        id: 's1',
        provider: 'claude',
        command: 'claude',
        args: '[]',
        mode: 'print',
        createdAt: '2026-01-01T00:00:00.000Z',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('insertEventSchema', () => {
    it('should validate a valid event row', () => {
      const result = insertEventSchema.safeParse({
        sessionId: 's1',
        dir: 'out',
        type: 'text',
        data: '{"content":"hello"}',
        createdAt: '2026-01-01T00:00:00.000Z',
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing required fields', () => {
      const result = insertEventSchema.safeParse({ sessionId: 's1' });
      expect(result.success).toBe(false);
    });
  });
});
