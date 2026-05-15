import {
  Broadcaster,
  CachedDataSource,
  FilesDataSource,
  GitDataSource,
} from '@code-quest/broadcaster';
import type { AgentTransport } from '@code-quest/schemas';
import { REMOTE_METHODS } from '@code-quest/schemas';
import { FakeFilesystemService, FakeGitService, FakeWatchService } from '@code-quest/test-kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BroadcasterHandler } from '../broadcaster-handler.ts';

function makeFakeRpc() {
  const handlers = new Map<string, (data: unknown) => Promise<unknown>>();
  const emitted: Array<[string, unknown]> = [];
  const rpc: AgentTransport = {
    emit: (event, data) => {
      emitted.push([event, data]);
    },
    on: vi.fn(() => () => {}),
    onRequest: (event, handler) => {
      handlers.set(event, handler);
      return () => {};
    },
  };
  return {
    rpc,
    emitted,
    request: (method: string, params: unknown) => handlers.get(method)?.(params),
  };
}

function snapshots(emitted: Array<[string, unknown]>, type?: string) {
  return emitted.filter(([e, p]) => {
    if (e !== REMOTE_METHODS.watch.snapshot) return false;
    if (type) return (p as Record<string, unknown>).type === type;
    return true;
  });
}

describe('BroadcasterHandler', () => {
  let watch: FakeWatchService;
  let fs: FakeFilesystemService;
  let git: FakeGitService;
  let broadcaster: Broadcaster;

  beforeEach(() => {
    watch = new FakeWatchService();
    fs = new FakeFilesystemService();
    fs.setRoots(['/repo']);
    git = new FakeGitService();
    broadcaster = new Broadcaster()
      .add('files', (cwd) => new CachedDataSource(new FilesDataSource(cwd, '', watch, fs)))
      .add('git', (cwd) => new GitDataSource(cwd, watch, git));
  });

  it('watch.start sends initial files snapshot on subscribe', async () => {
    const { rpc, emitted, request } = makeFakeRpc();
    new BroadcasterHandler(broadcaster).attach(rpc);

    await request(REMOTE_METHODS.watch.start, { cwd: '/repo' });
    await vi.waitUntil(() => snapshots(emitted, 'files').length > 0, { timeout: 500 });

    const snap = snapshots(emitted, 'files')[0]![1] as Record<string, unknown>;
    expect(snap.cwd).toBe('/repo');
    expect(snap.type).toBe('files');
  });

  it('watch.start pushes files snapshot on file change', async () => {
    const { rpc, emitted, request } = makeFakeRpc();
    new BroadcasterHandler(broadcaster).attach(rpc);

    await request(REMOTE_METHODS.watch.start, { cwd: '/repo' });
    await vi.waitUntil(() => snapshots(emitted, 'files').length > 0, { timeout: 500 });

    const countBefore = snapshots(emitted, 'files').length;
    watch.simulate('/repo', { type: 'change', path: 'src/foo.ts' });
    await vi.waitUntil(() => snapshots(emitted, 'files').length > countBefore, { timeout: 500 });

    const snap = snapshots(emitted, 'files').at(-1)![1] as Record<string, unknown>;
    expect(snap.cwd).toBe('/repo');
    expect(snap.type).toBe('files');
  });

  it('watch.start pushes git snapshot on .git/HEAD change', async () => {
    const { rpc, emitted, request } = makeFakeRpc();
    new BroadcasterHandler(broadcaster).attach(rpc);

    await request(REMOTE_METHODS.watch.start, { cwd: '/repo' });
    await vi.waitUntil(() => snapshots(emitted, 'git').length > 0, { timeout: 500 });

    const countBefore = snapshots(emitted, 'git').length;
    watch.simulate('/repo', { type: 'change', path: '.git/HEAD' });
    await vi.waitUntil(() => snapshots(emitted, 'git').length > countBefore, { timeout: 500 });

    const snap = snapshots(emitted, 'git').at(-1)![1] as Record<string, unknown>;
    expect(snap.cwd).toBe('/repo');
    expect(snap.type).toBe('git');
  });

  it('watch.stop unsubscribes and stops snapshot delivery', async () => {
    const { rpc, emitted, request } = makeFakeRpc();
    new BroadcasterHandler(broadcaster).attach(rpc);

    await request(REMOTE_METHODS.watch.start, { cwd: '/repo' });
    await vi.waitUntil(() => snapshots(emitted).length > 0, { timeout: 500 });

    await request(REMOTE_METHODS.watch.stop, { cwd: '/repo' });
    const countBefore = emitted.length;

    watch.simulate('/repo', { type: 'change', path: 'src/foo.ts' });
    await new Promise((r) => setTimeout(r, 50));

    expect(emitted.length).toBe(countBefore);
  });

  it('watch.start for same cwd is guarded — does not create duplicate subscription', async () => {
    const { rpc, emitted, request } = makeFakeRpc();
    new BroadcasterHandler(broadcaster).attach(rpc);

    await request(REMOTE_METHODS.watch.start, { cwd: '/repo' });
    await vi.waitUntil(() => snapshots(emitted, 'files').length > 0, { timeout: 500 });
    await request(REMOTE_METHODS.watch.start, { cwd: '/repo' }); // duplicate
    const countAfter = snapshots(emitted, 'files').length;

    watch.simulate('/repo', { type: 'change', path: 'src/foo.ts' });
    await vi.waitUntil(() => snapshots(emitted, 'files').length > countAfter, { timeout: 500 });

    expect(snapshots(emitted, 'files').length).toBe(countAfter + 1);
  });
});
