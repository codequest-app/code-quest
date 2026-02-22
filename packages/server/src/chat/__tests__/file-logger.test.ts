import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FileChatLogger } from '../file-logger.ts';

describe('FileChatLogger', () => {
  let tmpDir: string;
  let logger: FileChatLogger;
  const originalCwd = process.cwd;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chat-logger-'));
    process.cwd = () => tmpDir;
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-22T01:55:00.000Z'));
    logger = new FileChatLogger();
  });

  afterEach(() => {
    process.cwd = originalCwd;
    vi.useRealTimers();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should write a JSONL line to the correct file', () => {
    logger.log('abc123', { dir: 'in', type: 'user_message', data: { message: 'hello' } });

    const filePath = path.join(tmpDir, 'logs', 'chat-abc123.jsonl');
    const content = fs.readFileSync(filePath, 'utf-8').trim();
    const parsed = JSON.parse(content);

    expect(parsed).toEqual({
      ts: '2026-02-22T01:55:00.000Z',
      sid: 'abc123',
      dir: 'in',
      type: 'user_message',
      data: { message: 'hello' },
    });
  });

  it('should append multiple lines', () => {
    logger.log('s1', { dir: 'in', type: 'user_message', data: { message: 'a' } });
    vi.setSystemTime(new Date('2026-02-22T01:55:01.000Z'));
    logger.log('s1', { dir: 'out', type: 'text', data: { content: 'b' } });

    const filePath = path.join(tmpDir, 'logs', 'chat-s1.jsonl');
    const lines = fs.readFileSync(filePath, 'utf-8').trim().split('\n');
    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0]).type).toBe('user_message');
    expect(JSON.parse(lines[1]).type).toBe('text');
  });

  it('should write to separate files per session', () => {
    logger.log('s1', { dir: 'in', type: 'user_message', data: {} });
    logger.log('s2', { dir: 'in', type: 'user_message', data: {} });

    expect(fs.existsSync(path.join(tmpDir, 'logs', 'chat-s1.jsonl'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'logs', 'chat-s2.jsonl'))).toBe(true);
  });

  it('close should not throw', () => {
    logger.log('s1', { dir: 'in', type: 'user_message', data: {} });
    expect(() => logger.close('s1')).not.toThrow();
  });
});
