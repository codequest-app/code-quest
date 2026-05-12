import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TypedSocket } from '../client.ts';
import { rpc } from '../rpc.ts';

function makeFakeSocket(respond?: (cb: (r: unknown) => void) => void): TypedSocket {
  return {
    connected: true,
    id: 'test',
    emit: vi.fn((...args: unknown[]) => {
      const cb = args[args.length - 1];
      if (typeof cb === 'function') respond?.(cb as (r: unknown) => void);
    }),
    on: vi.fn(),
    off: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
  } as unknown as TypedSocket;
}

describe('rpc', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves when server responds', async () => {
    const socket = makeFakeSocket((cb) => cb({ ok: true, data: 'result' }));
    const result = await rpc(socket, 'session:launch' as never);
    expect(result).toEqual({ ok: true, data: 'result' });
  });

  it('rejects with timeout error when server never responds', async () => {
    const socket = makeFakeSocket(); // never calls callback
    const promise = rpc(socket, 'session:launch' as never);
    vi.advanceTimersByTime(15_000);
    await expect(promise).rejects.toThrow('timeout');
  });
});
