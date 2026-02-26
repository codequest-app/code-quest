import type { SpawnOptions } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import type { ProcessFactory } from '@code-quest/summoner';
import { DefaultSessionManager } from '../services/session-manager.ts';

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

  const mockDb = {
    insert: () => ({ values: () => Promise.resolve() }),
  } as unknown as import('../db/client.ts').DrizzleDatabase;

  beforeEach(() => {
    mock = createMockProcessFactory();
    manager = new DefaultSessionManager(mock.factory, mockDb);
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
});
