import { REMOTE_METHODS } from '@code-quest/schemas';
import { describe, expect, it, vi } from 'vitest';
import { RemoteBroadcaster } from '../remote-broadcaster.ts';

function makeFakeRpc() {
  const requests: Array<[string, unknown]> = [];
  const handlers = new Map<string, (...args: unknown[]) => void>();
  return {
    request: vi.fn(async (method: string, params: unknown) => {
      requests.push([method, params]);
      return { ok: true };
    }),
    on: vi.fn((event: string, fn: (...args: unknown[]) => void) => {
      handlers.set(event, fn);
      return () => handlers.delete(event);
    }),
    simulate: (event: string, ...args: unknown[]) => handlers.get(event)?.(...args),
    requests,
  };
}

describe('RemoteBroadcaster', () => {
  it('first subscribe sends watch/start RPC', async () => {
    const rpc = makeFakeRpc();
    const broadcaster = new RemoteBroadcaster(rpc);

    broadcaster.subscribe('/repo', 'socket-1', vi.fn());

    await vi.waitUntil(() => rpc.requests.some(([m]) => m === REMOTE_METHODS.watch.start), {
      timeout: 500,
    });
    expect(rpc.requests).toContainEqual([REMOTE_METHODS.watch.start, { cwd: '/repo' }]);
  });

  it('second subscribe does NOT send another watch/start', async () => {
    const rpc = makeFakeRpc();
    const broadcaster = new RemoteBroadcaster(rpc);

    broadcaster.subscribe('/repo', 'socket-1', vi.fn());
    broadcaster.subscribe('/repo', 'socket-2', vi.fn());

    await vi.waitUntil(() => rpc.requests.length > 0, { timeout: 500 });
    const starts = rpc.requests.filter(([m]) => m === REMOTE_METHODS.watch.start);
    expect(starts).toHaveLength(1);
  });

  it('last unsubscribe sends watch/stop RPC', async () => {
    const rpc = makeFakeRpc();
    const broadcaster = new RemoteBroadcaster(rpc);

    const off1 = broadcaster.subscribe('/repo', 'socket-1', vi.fn());
    const off2 = broadcaster.subscribe('/repo', 'socket-2', vi.fn());

    off1();
    expect(rpc.requests.some(([m]) => m === REMOTE_METHODS.watch.stop)).toBe(false);

    off2();
    await vi.waitUntil(() => rpc.requests.some(([m]) => m === REMOTE_METHODS.watch.stop), {
      timeout: 500,
    });
    expect(rpc.requests).toContainEqual([REMOTE_METHODS.watch.stop, { cwd: '/repo' }]);
  });

  it('delivers snapshot with type and data to subscribers', () => {
    const rpc = makeFakeRpc();
    const broadcaster = new RemoteBroadcaster(rpc);
    const cb = vi.fn();

    broadcaster.subscribe('/repo', 'socket-1', cb);

    const snapshotData = [{ path: 'src/foo.ts', name: 'foo.ts', type: 'file' }];
    rpc.simulate(REMOTE_METHODS.watch.snapshot, {
      cwd: '/repo',
      type: 'files',
      data: snapshotData,
    });

    expect(cb).toHaveBeenCalledWith('files', snapshotData);
  });

  it('delivers git snapshot with correct type and data', () => {
    const rpc = makeFakeRpc();
    const broadcaster = new RemoteBroadcaster(rpc);
    const cb = vi.fn();

    broadcaster.subscribe('/repo', 'socket-1', cb);

    const data = { branch: 'main', isClean: true, changedFiles: [] };
    rpc.simulate(REMOTE_METHODS.watch.snapshot, { cwd: '/repo', type: 'git', data });

    expect(cb).toHaveBeenCalledWith('git', data);
  });

  it('does NOT deliver snapshot for different cwd', () => {
    const rpc = makeFakeRpc();
    const broadcaster = new RemoteBroadcaster(rpc);
    const cb = vi.fn();

    broadcaster.subscribe('/repo', 'socket-1', cb);

    rpc.simulate(REMOTE_METHODS.watch.snapshot, { cwd: '/other', type: 'files', data: [] });

    expect(cb).not.toHaveBeenCalled();
  });

  it('delivers snapshot to all subscribers for a cwd', () => {
    const rpc = makeFakeRpc();
    const broadcaster = new RemoteBroadcaster(rpc);
    const cb1 = vi.fn();
    const cb2 = vi.fn();

    broadcaster.subscribe('/repo', 'socket-1', cb1);
    broadcaster.subscribe('/repo', 'socket-2', cb2);

    const data = { branch: 'main', isClean: true, changedFiles: [] };
    rpc.simulate(REMOTE_METHODS.watch.snapshot, { cwd: '/repo', type: 'git', data });

    expect(cb1).toHaveBeenCalledWith('git', data);
    expect(cb2).toHaveBeenCalledWith('git', data);
  });

  it('unsubscribed callback no longer receives snapshots', () => {
    const rpc = makeFakeRpc();
    const broadcaster = new RemoteBroadcaster(rpc);
    const cb = vi.fn();

    const off = broadcaster.subscribe('/repo', 'socket-1', cb);
    off();

    rpc.simulate(REMOTE_METHODS.watch.snapshot, {
      cwd: '/repo',
      type: 'openspec',
      data: { changes: [], specs: [] },
    });

    expect(cb).not.toHaveBeenCalled();
  });
});
