import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DrizzleChatLogger } from '../drizzle-logger.ts';
import { events, sessions } from '../schema-sqlite.ts';
import type { SqliteDatabase } from '../sqlite-repository.ts';
import { createSqliteRepository } from '../sqlite-repository.ts';

describe('DrizzleChatLogger', () => {
  let db: SqliteDatabase;
  let logger: DrizzleChatLogger;

  beforeEach(() => {
    const repo = createSqliteRepository(':memory:');
    db = repo.db;
    logger = new DrizzleChatLogger(repo);
  });

  afterEach(() => {
    // in-memory DB is GC'd automatically
  });

  describe('createSession', () => {
    it('should insert a session row with all fields', () => {
      logger.createSession('s1', {
        provider: 'claude',
        command: 'claude',
        args: ['--verbose', '--output-format', 'stream-json'],
        cwd: '/tmp/test',
        mode: 'interactive',
      });

      const rows = db.select().from(sessions).where(eq(sessions.id, 's1')).all();
      expect(rows).toHaveLength(1);

      const row = rows[0];
      expect(row.provider).toBe('claude');
      expect(row.command).toBe('claude');
      expect(JSON.parse(row.args)).toEqual(['--verbose', '--output-format', 'stream-json']);
      expect(row.cwd).toBe('/tmp/test');
      expect(row.mode).toBe('interactive');
      expect(row.createdAt).toBeTruthy();
    });

    it('should allow null cwd', () => {
      logger.createSession('s2', {
        provider: 'gemini',
        command: 'gemini',
        args: ['-o', 'stream-json'],
        mode: 'print',
      });

      const rows = db.select().from(sessions).where(eq(sessions.id, 's2')).all();
      expect(rows[0].cwd).toBeNull();
    });
  });

  describe('log', () => {
    beforeEach(() => {
      logger.createSession('s1', {
        provider: 'claude',
        command: 'claude',
        args: [],
        mode: 'print',
      });
    });

    it('should log user_message with dir=in', () => {
      logger.log('s1', { dir: 'in', type: 'user_message', data: { message: 'hello' } });

      const rows = db.select().from(events).where(eq(events.sessionId, 's1')).all();
      expect(rows).toHaveLength(1);
      expect(rows[0].dir).toBe('in');
      expect(rows[0].type).toBe('user_message');
      expect(JSON.parse(rows[0].data)).toEqual({ message: 'hello' });
    });

    it('should log text event with dir=out', () => {
      logger.log('s1', { dir: 'out', type: 'text', data: { content: 'Hi there' } });

      const rows = db.select().from(events).where(eq(events.sessionId, 's1')).all();
      expect(rows[0].dir).toBe('out');
      expect(rows[0].type).toBe('text');
      expect(JSON.parse(rows[0].data)).toEqual({ content: 'Hi there' });
    });

    it('should log tool_use event', () => {
      logger.log('s1', {
        dir: 'out',
        type: 'tool_use',
        data: { tool: 'Read', input: { path: '/tmp' } },
      });

      const rows = db.select().from(events).where(eq(events.sessionId, 's1')).all();
      expect(JSON.parse(rows[0].data)).toEqual({ tool: 'Read', input: { path: '/tmp' } });
    });

    it('should log allow_tool event with dir=in', () => {
      logger.log('s1', { dir: 'in', type: 'allow_tool', data: { toolName: 'Bash' } });

      const rows = db.select().from(events).where(eq(events.sessionId, 's1')).all();
      expect(rows[0].dir).toBe('in');
      expect(rows[0].type).toBe('allow_tool');
      expect(JSON.parse(rows[0].data)).toEqual({ toolName: 'Bash' });
    });

    it('should log control_request_sent', () => {
      logger.log('s1', {
        dir: 'in',
        type: 'control_request_sent',
        data: { subtype: 'set_model', params: { model: 'opus' } },
      });

      const rows = db.select().from(events).where(eq(events.sessionId, 's1')).all();
      expect(JSON.parse(rows[0].data)).toEqual({
        subtype: 'set_model',
        params: { model: 'opus' },
      });
    });

    it('should return events in order by created_at', () => {
      logger.log('s1', { dir: 'in', type: 'user_message', data: { message: 'first' } });
      logger.log('s1', { dir: 'out', type: 'text', data: { content: 'second' } });
      logger.log('s1', { dir: 'out', type: 'tool_use', data: { tool: 'Bash' } });

      const rows = db
        .select()
        .from(events)
        .where(eq(events.sessionId, 's1'))
        .orderBy(events.createdAt)
        .all();
      expect(rows).toHaveLength(3);
      expect(rows[0].type).toBe('user_message');
      expect(rows[1].type).toBe('text');
      expect(rows[2].type).toBe('tool_use');
    });
  });

  describe('close', () => {
    it('should not throw', () => {
      expect(() => logger.close('s1')).not.toThrow();
    });
  });
});
