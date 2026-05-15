import type { Broadcaster } from '@code-quest/broadcaster';
import type {
  FileResult,
  GitStatusResult,
  OpenspecListResult,
  TypedSocket,
} from '@code-quest/schemas';
import { EVENTS } from '@code-quest/schemas';
import { describe, expect, it, vi } from 'vitest';
import { subscribeSnapshotForSocket } from '../snapshot-subscriber.ts';

function makeSocket(): TypedSocket & { emitted: Array<[string, unknown]> } {
  const emitted: Array<[string, unknown]> = [];
  return {
    id: 'socket-1',
    emit: vi.fn((event: string, payload: unknown) => {
      emitted.push([event, payload]);
    }),
    on: vi.fn(),
    emitted,
  };
}

function makeBroadcaster(): {
  broadcaster: Broadcaster;
  push(cwd: string, type: string, data: unknown): void;
} {
  const subs = new Map<string, (type: string, data: unknown) => void>();
  const broadcaster = {
    subscribe: vi.fn((cwd: string, id: string, cb: (type: string, data: unknown) => void) => {
      subs.set(`${cwd}:${id}`, cb);
      return () => subs.delete(`${cwd}:${id}`);
    }),
  } as unknown as Broadcaster;
  return {
    broadcaster,
    push(cwd, type, data) {
      for (const [key, cb] of subs) {
        if (key.startsWith(`${cwd}:`)) cb(type, data);
      }
    },
  };
}

const FILES: FileResult[] = [{ path: 'src/foo.ts', name: 'foo.ts', type: 'file' }];
const GIT: GitStatusResult = {
  branch: 'main',
  isClean: true,
  changedFiles: [],
  ahead: 0,
  behind: 0,
  hasUpstream: false,
};
const OPENSPEC: OpenspecListResult = { changes: [], specs: [] };

describe('subscribeSnapshotForSocket', () => {
  it('files broadcaster push emits files:dirty with snapshot', () => {
    const socket = makeSocket();
    const { broadcaster, push } = makeBroadcaster();

    subscribeSnapshotForSocket(socket, 'sub-1', '/repo', broadcaster);

    push('/repo', 'files', FILES);

    expect(socket.emitted).toContainEqual([
      EVENTS.fs.dirty,
      { cwd: '/repo', paths: [], snapshot: FILES },
    ]);
  });

  it('git broadcaster push emits git:dirty with snapshot', () => {
    const socket = makeSocket();
    const { broadcaster, push } = makeBroadcaster();

    subscribeSnapshotForSocket(socket, 'sub-1', '/repo', broadcaster);

    push('/repo', 'git', GIT);

    expect(socket.emitted).toContainEqual([EVENTS.git.dirty, { cwd: '/repo', snapshot: GIT }]);
  });

  it('openspec broadcaster push emits openspec:dirty with snapshot', () => {
    const socket = makeSocket();
    const { broadcaster, push } = makeBroadcaster();

    subscribeSnapshotForSocket(socket, 'sub-1', '/repo', broadcaster);

    push('/repo', 'openspec', OPENSPEC);

    expect(socket.emitted).toContainEqual([
      EVENTS.openspec.dirty,
      { cwd: '/repo', snapshot: OPENSPEC },
    ]);
  });

  it('returns unsubscribe function that stops further delivery', () => {
    const socket = makeSocket();
    const { broadcaster, push } = makeBroadcaster();

    const off = subscribeSnapshotForSocket(socket, 'sub-1', '/repo', broadcaster);
    off();

    push('/repo', 'files', FILES);
    push('/repo', 'git', GIT);
    push('/repo', 'openspec', OPENSPEC);

    expect(socket.emitted).toHaveLength(0);
  });
});
