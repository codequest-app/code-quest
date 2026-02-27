import type { SpawnOptions } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { dirname, resolve } from 'node:path';
import { PassThrough } from 'node:stream';
import { fileURLToPath } from 'node:url';
import type { ProcessFactory } from '@code-quest/summoner';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { sessions } from '../db/schema-sqlite.ts';
import { createDatabase } from '../db/sqlite-client.ts';
import { DrizzleSessionStore } from '../services/drizzle-session-store.ts';
import { DefaultSessionManager } from '../services/session-manager.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsFolder = resolve(__dirname, '../../drizzle/sqlite');

class MockProcess extends EventEmitter {
  readonly stdin = new PassThrough();
  readonly stdout = new PassThrough();
  readonly stderr = new PassThrough();
  pid = 12345;
  killed = false;

  kill(signal?: string): boolean {
    this.killed = true;
    this.emit('close', null, signal ?? null);
    return true;
  }

  emitClose(code = 0): void {
    this.stdout.end();
    this.stderr.end();
    this.emit('close', code, null);
  }
}

function createMockProcessFactory() {
  const processes: MockProcess[] = [];
  const factory = ((_command: string, _args: string[], _options: SpawnOptions) => {
    const proc = new MockProcess();
    processes.push(proc);
    return proc;
  }) as unknown as ProcessFactory;
  return { factory, processes };
}

describe('DefaultSessionManager', () => {
  let manager: DefaultSessionManager;
  let mock: ReturnType<typeof createMockProcessFactory>;
  let db: ReturnType<typeof createDatabase>;
  let sessionStore: DrizzleSessionStore;

  beforeEach(() => {
    mock = createMockProcessFactory();
    db = createDatabase(':memory:');
    migrate(db, { migrationsFolder });
    sessionStore = new DrizzleSessionStore(db, sessions);
    manager = new DefaultSessionManager(mock.factory, sessionStore);
  });

  it('creates a session with a unique id', () => {
    const session = manager.create();
    expect(session.id).toBeDefined();
    expect(typeof session.id).toBe('string');
  });

  it('retrieves a created session by id', () => {
    const session = manager.create();
    expect(manager.get(session.id)).toBe(session);
  });

  it('returns undefined for unknown session id', () => {
    expect(manager.get('nonexistent')).toBeUndefined();
  });

  it('kills a session', () => {
    const session = manager.create();
    const killSpy = vi.spyOn(session, 'kill');
    manager.kill(session.id);
    expect(killSpy).toHaveBeenCalled();
    expect(manager.get(session.id)).toBeUndefined();
  });

  it('killing unknown session is a no-op', () => {
    expect(() => manager.kill('nonexistent')).not.toThrow();
  });

  it('removes session from map on exit event', () => {
    const session = manager.create();
    session.sendMessage('hello');
    const proc = mock.processes[0];
    proc.emitClose(0);
    expect(manager.get(session.id)).toBeUndefined();
  });

  it('lists all sessions', () => {
    const s1 = manager.create();
    const s2 = manager.create();
    const all = manager.getAll();
    expect(all).toHaveLength(2);
    expect(all.map((s) => s.id)).toContain(s1.id);
    expect(all.map((s) => s.id)).toContain(s2.id);
  });

  it('creates a session with resume id', () => {
    const session = manager.create('resume-123');
    expect(session).toBeDefined();
  });

  it('persists session on create with all fields', async () => {
    const session = manager.create();

    // Wait for async persist to complete
    await new Promise((resolve) => setTimeout(resolve, 10));

    const rows = db.select().from(sessions).all();
    expect(rows).toHaveLength(1);

    const record = rows[0];
    expect(record.id).toBe(session.id);
    expect(record.provider).toBe('claude');
    expect(record.command).toBe('claude');
    expect(record.args).toBe(
      JSON.stringify([
        '--output-format',
        'stream-json',
        '--input-format',
        'stream-json',
        '--verbose',
      ]),
    );
    expect(record.mode).toBe('interactive');
    expect(record.role).toBe('chat');
    expect(record.cwd).toBeDefined();
    expect(record.createdAt).toBeDefined();
  });
});
