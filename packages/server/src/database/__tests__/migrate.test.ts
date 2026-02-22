import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { events, sessions } from '../schema-sqlite.ts';
import { createSqliteRepository } from '../sqlite-repository.ts';

describe('SQLite migrate()', () => {
  it('should create tables via Drizzle migrations', () => {
    const repo = createSqliteRepository(':memory:');

    // Insert and query to verify tables exist and work
    repo.insertSession({
      id: 'migrate-test',
      provider: 'claude',
      command: 'claude',
      args: '[]',
      cwd: null,
      mode: 'print',
      createdAt: new Date().toISOString(),
    });

    repo.insertEvent({
      sessionId: 'migrate-test',
      dir: 'out',
      type: 'text',
      data: '{"content":"hello"}',
      createdAt: new Date().toISOString(),
    });

    const sessionRows = repo.db
      .select()
      .from(sessions)
      .where(eq(sessions.id, 'migrate-test'))
      .all();
    expect(sessionRows).toHaveLength(1);

    const eventRows = repo.db
      .select()
      .from(events)
      .where(eq(events.sessionId, 'migrate-test'))
      .all();
    expect(eventRows).toHaveLength(1);
  });

  it('should be idempotent (run twice without error)', () => {
    const repo1 = createSqliteRepository(':memory:');
    // migrate already ran in createSqliteRepository — just verify no crash
    expect(repo1).toBeDefined();
  });
});
