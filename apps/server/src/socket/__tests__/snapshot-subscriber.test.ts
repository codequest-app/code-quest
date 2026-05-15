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

function makeBroadcaster<T>(): {
  broadcaster: Broadcaster<T>;
  push(cwd: string, value: T): void;
} {
  const subs = new Map<string, (v: T) => void>();
  const broadcaster = {
    subscribe: vi.fn((cwd: string, id: string, cb: (v: T) => void) => {
      subs.set(`${cwd}:${id}`, cb);
      return () => subs.delete(`${cwd}:${id}`);
    }),
  } as unknown as Broadcaster<T>;
  return {
    broadcaster,
    push(cwd, value) {
      for (const [key, cb] of subs) {
        if (key.startsWith(`${cwd}:`)) cb(value);
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
    const files = makeBroadcaster<FileResult[]>();
    const git = makeBroadcaster<GitStatusResult>();
    const openspec = makeBroadcaster<OpenspecListResult>();

    subscribeSnapshotForSocket(socket, 'sub-1', '/repo', {
      files: files.broadcaster,
      git: git.broadcaster,
      openspec: openspec.broadcaster,
    });

    files.push('/repo', FILES);

    expect(socket.emitted).toContainEqual([
      EVENTS.fs.dirty,
      { cwd: '/repo', paths: [], snapshot: FILES },
    ]);
  });

  it('git broadcaster push emits git:dirty with snapshot', () => {
    const socket = makeSocket();
    const files = makeBroadcaster<FileResult[]>();
    const git = makeBroadcaster<GitStatusResult>();
    const openspec = makeBroadcaster<OpenspecListResult>();

    subscribeSnapshotForSocket(socket, 'sub-1', '/repo', {
      files: files.broadcaster,
      git: git.broadcaster,
      openspec: openspec.broadcaster,
    });

    git.push('/repo', GIT);

    expect(socket.emitted).toContainEqual([EVENTS.git.dirty, { cwd: '/repo', snapshot: GIT }]);
  });

  it('openspec broadcaster push emits openspec:dirty with snapshot', () => {
    const socket = makeSocket();
    const files = makeBroadcaster<FileResult[]>();
    const git = makeBroadcaster<GitStatusResult>();
    const openspec = makeBroadcaster<OpenspecListResult>();

    subscribeSnapshotForSocket(socket, 'sub-1', '/repo', {
      files: files.broadcaster,
      git: git.broadcaster,
      openspec: openspec.broadcaster,
    });

    openspec.push('/repo', OPENSPEC);

    expect(socket.emitted).toContainEqual([
      EVENTS.openspec.dirty,
      { cwd: '/repo', snapshot: OPENSPEC },
    ]);
  });

  it('returns unsubscribe functions that stop further delivery', () => {
    const socket = makeSocket();
    const files = makeBroadcaster<FileResult[]>();
    const git = makeBroadcaster<GitStatusResult>();
    const openspec = makeBroadcaster<OpenspecListResult>();

    const offs = subscribeSnapshotForSocket(socket, 'sub-1', '/repo', {
      files: files.broadcaster,
      git: git.broadcaster,
      openspec: openspec.broadcaster,
    });

    for (const off of offs) off();

    files.push('/repo', FILES);
    git.push('/repo', GIT);
    openspec.push('/repo', OPENSPEC);

    expect(socket.emitted).toHaveLength(0);
  });
});
