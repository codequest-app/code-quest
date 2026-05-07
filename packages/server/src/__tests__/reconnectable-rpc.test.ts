import { describe, expect, it, vi } from 'vitest';
import { ReconnectableRpc } from '../remote/reconnectable-rpc.ts';
import type { RemoteRpcWithEvents } from '../remote/types.ts';

function fakeRpc(): RemoteRpcWithEvents & { fireDisconnect: () => void } {
  const listeners = new Map<string, Set<(...args: unknown[]) => void>>();
  return {
    request: vi.fn(async (_method: string, _params: unknown) => ({
      ok: true,
    })) as RemoteRpcWithEvents['request'],
    on(event, fn) {
      let set = listeners.get(event);
      if (!set) {
        set = new Set();
        listeners.set(event, set);
      }
      set.add(fn);
      return () => set.delete(fn);
    },
    fireDisconnect() {
      const set = listeners.get('disconnect');
      if (set) for (const fn of set) fn();
    },
  };
}

describe('ReconnectableRpc', () => {
  it('rejects when no rpc connected', async () => {
    const rpc = new ReconnectableRpc();
    await expect(rpc.request('test', {})).rejects.toThrow('No remote daemon connected');
  });

  it('forwards request after replace', async () => {
    const rpc = new ReconnectableRpc();
    const inner = fakeRpc();
    rpc.replace(inner);

    await rpc.request('fs/read', { path: '/tmp' });
    expect(inner.request).toHaveBeenCalledWith('fs/read', { path: '/tmp' });
  });

  it('rejects after inner disconnects', async () => {
    const rpc = new ReconnectableRpc();
    const inner = fakeRpc();
    rpc.replace(inner);

    inner.fireDisconnect();
    await expect(rpc.request('test', {})).rejects.toThrow('No remote daemon connected');
  });

  it('reconnect with new rpc works after disconnect', async () => {
    const rpc = new ReconnectableRpc();
    const first = fakeRpc();
    rpc.replace(first);

    first.fireDisconnect();
    expect(rpc.connected).toBe(false);

    const second = fakeRpc();
    rpc.replace(second);
    expect(rpc.connected).toBe(true);

    await rpc.request('test', {});
    expect(second.request).toHaveBeenCalled();
    expect(first.request).toHaveBeenCalledTimes(0);
  });

  it('old disconnect does not affect new connection', async () => {
    const rpc = new ReconnectableRpc();
    const first = fakeRpc();
    rpc.replace(first);

    const second = fakeRpc();
    rpc.replace(second);

    // Old one disconnects — should NOT null out current since we already replaced
    first.fireDisconnect();
    expect(rpc.connected).toBe(true);

    await rpc.request('test', {});
    expect(second.request).toHaveBeenCalled();
  });
});
