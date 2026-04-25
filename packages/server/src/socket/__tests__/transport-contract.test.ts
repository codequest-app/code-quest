import type { IncomingMessage } from 'node:http';
import { describe, expect, it, vi } from 'vitest';
import type { Authenticator } from '../authenticator.ts';
import type { Transport, TransportHandle } from '../transport.ts';
import type { TypedSocket } from '../types.ts';

/**
 * Contract tests for the Transport interface. Any concrete Transport
 * implementation (SocketIoTransport, WsTransport, future ones) MUST pass
 * this suite. The in-test `MemoryTransport` is the simplest possible impl —
 * it never touches HTTP, it just lets tests `simulateConnect()` to push
 * a synthetic TypedSocket through onConnection listeners.
 *
 * The fact that this minimal impl satisfies the contract proves the
 * interface is small enough not to leak transport-specific assumptions.
 */
describe('Transport contract', () => {
  /** Test double — simplest Transport that never touches HTTP. */
  class MemoryTransport implements Transport {
    private listeners = new Set<(socket: TypedSocket) => void>();
    private closed = false;

    constructor(private readonly auth: Authenticator) {}

    attach(): TransportHandle {
      return {
        onConnection: (cb) => {
          this.listeners.add(cb);
          return () => this.listeners.delete(cb);
        },
        close: async () => {
          this.closed = true;
          this.listeners.clear();
        },
      };
    }

    /** Test-only: simulate a connection through any onConnection listeners. */
    async simulateConnect(req: IncomingMessage, socket: TypedSocket): Promise<boolean> {
      if (this.closed) return false;
      const ctx = await this.auth.authenticate(req);
      if (!ctx) return false;
      for (const cb of this.listeners) cb(socket);
      return true;
    }
  }

  function fakeReq(): IncomingMessage {
    return { headers: {} } as IncomingMessage;
  }

  function fakeSocket(id: string): TypedSocket {
    return { id, emit: vi.fn(), on: vi.fn() };
  }

  function alwaysAuth(userId = 'anon'): Authenticator {
    return { authenticate: async () => ({ userId }) };
  }

  it('attach returns a handle with onConnection and close', () => {
    const t = new MemoryTransport(alwaysAuth());
    const handle = t.attach();

    expect(typeof handle.onConnection).toBe('function');
    expect(typeof handle.close).toBe('function');
  });

  it('onConnection listener fires when a connection is accepted', async () => {
    const t = new MemoryTransport(alwaysAuth());
    const handle = t.attach();
    const listener = vi.fn();
    handle.onConnection(listener);

    const sock = fakeSocket('s-1');
    await t.simulateConnect(fakeReq(), sock);

    expect(listener).toHaveBeenCalledWith(sock);
  });

  it('multiple listeners all fire for the same connection', async () => {
    const t = new MemoryTransport(alwaysAuth());
    const handle = t.attach();
    const a = vi.fn();
    const b = vi.fn();
    handle.onConnection(a);
    handle.onConnection(b);

    await t.simulateConnect(fakeReq(), fakeSocket('s-1'));

    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
  });

  it('unsubscribe stops further callbacks', async () => {
    const t = new MemoryTransport(alwaysAuth());
    const handle = t.attach();
    const listener = vi.fn();
    const off = handle.onConnection(listener);

    off();
    await t.simulateConnect(fakeReq(), fakeSocket('s-1'));

    expect(listener).not.toHaveBeenCalled();
  });

  it('close prevents new connections from firing listeners', async () => {
    const t = new MemoryTransport(alwaysAuth());
    const handle = t.attach();
    const listener = vi.fn();
    handle.onConnection(listener);

    await handle.close();
    await t.simulateConnect(fakeReq(), fakeSocket('s-1'));

    expect(listener).not.toHaveBeenCalled();
  });

  it('failed authentication blocks the connection from reaching listeners', async () => {
    const denyAuth: Authenticator = { authenticate: async () => null };
    const t = new MemoryTransport(denyAuth);
    const handle = t.attach();
    const listener = vi.fn();
    handle.onConnection(listener);

    const result = await t.simulateConnect(fakeReq(), fakeSocket('s-1'));

    expect(result).toBe(false);
    expect(listener).not.toHaveBeenCalled();
  });
});
