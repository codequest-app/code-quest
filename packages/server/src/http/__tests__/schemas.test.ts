import { describe, expect, it } from 'vitest';
import {
  createTerminalRequestSchema,
  createTerminalResponseSchema,
  errorResponseSchema,
  healthResponseSchema,
  terminalInfoResponseSchema,
  terminalListResponseSchema,
} from '../schemas.ts';

describe('createTerminalRequestSchema', () => {
  it('should accept empty object', () => {
    const result = createTerminalRequestSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should accept all valid fields', () => {
    const result = createTerminalRequestSchema.safeParse({
      shell: '/bin/bash',
      cwd: '/home/user',
      cols: 80,
      rows: 24,
      args: ['--login'],
      env: { TERM: 'xterm-256color' },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        shell: '/bin/bash',
        cwd: '/home/user',
        cols: 80,
        rows: 24,
        args: ['--login'],
        env: { TERM: 'xterm-256color' },
      });
    }
  });

  it('should reject cols as string', () => {
    const result = createTerminalRequestSchema.safeParse({ cols: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('should reject rows as negative number', () => {
    const result = createTerminalRequestSchema.safeParse({ rows: -1 });
    expect(result.success).toBe(false);
  });

  it('should reject cols as 0', () => {
    const result = createTerminalRequestSchema.safeParse({ cols: 0 });
    expect(result.success).toBe(false);
  });

  it('should reject args containing non-string elements', () => {
    const result = createTerminalRequestSchema.safeParse({ args: [123] });
    expect(result.success).toBe(false);
  });

  it('should reject env with non-string values', () => {
    const result = createTerminalRequestSchema.safeParse({ env: { FOO: 42 } });
    expect(result.success).toBe(false);
  });

  it('should reject unknown fields', () => {
    const result = createTerminalRequestSchema.safeParse({ unknown: 'field' });
    expect(result.success).toBe(false);
  });

  it('should reject non-integer cols', () => {
    const result = createTerminalRequestSchema.safeParse({ cols: 80.5 });
    expect(result.success).toBe(false);
  });
});

describe('response schemas', () => {
  it('errorResponseSchema should parse valid error', () => {
    const result = errorResponseSchema.safeParse({ error: 'BadRequest', message: 'Invalid input' });
    expect(result.success).toBe(true);
  });

  it('healthResponseSchema should parse valid health response', () => {
    const result = healthResponseSchema.safeParse({
      status: 'ok',
      uptime: 12345,
      timestamp: '2026-01-01T00:00:00.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('healthResponseSchema should reject invalid status', () => {
    const result = healthResponseSchema.safeParse({
      status: 'error',
      uptime: 0,
      timestamp: '',
    });
    expect(result.success).toBe(false);
  });

  it('createTerminalResponseSchema should parse valid response', () => {
    const result = createTerminalResponseSchema.safeParse({ id: 'abc-123', pid: 1234 });
    expect(result.success).toBe(true);
  });

  it('terminalInfoResponseSchema should parse valid response', () => {
    const result = terminalInfoResponseSchema.safeParse({
      id: 'abc-123',
      pid: 1234,
      isAlive: true,
    });
    expect(result.success).toBe(true);
  });

  it('terminalListResponseSchema should parse valid response', () => {
    const result = terminalListResponseSchema.safeParse({
      sessions: [{ id: 'abc', pid: 1, isAlive: true }],
    });
    expect(result.success).toBe(true);
  });

  it('terminalListResponseSchema should parse empty sessions', () => {
    const result = terminalListResponseSchema.safeParse({ sessions: [] });
    expect(result.success).toBe(true);
  });
});
