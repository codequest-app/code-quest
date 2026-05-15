import type { TypedSocket } from '@code-quest/schemas';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ConnectionContext, Middleware } from '../../ws-transport.ts';
import { resumable } from '../resumable.ts';

function makeTypedSocket(id = 's-1'): TypedSocket & {
  emit: ReturnType<typeof vi.fn> & TypedSocket['emit'];
  listeners: Map<string, (...args: unknown[]) => void>;
} {
  const listeners = new Map<string, (...args: unknown[]) => void>();
  const emit = vi.fn() as ReturnType<typeof vi.fn> & TypedSocket['emit'];
  return {
    id,
    emit,
    on: vi.fn((event: string, fn: (...args: unknown[]) => void) => {
      listeners.set(event, fn);
    }),
    listeners,
  };
}

function makeContext(sessionKey?: string): ConnectionContext {
  const url = sessionKey ? `/ws?sessionKey=${sessionKey}` : '/ws';
  return {
    req: { url } as ConnectionContext['req'],
  };
}

async function runMiddleware(
  mw: Middleware,
  context: ConnectionContext,
  typed: ReturnType<typeof makeTypedSocket>,
): Promise<{ disconnectFn: (() => void) | undefined; terminateResolve: (() => void) | undefined }> {
  let terminateResolve: (() => void) | undefined;
  context.terminate = () =>
    new Promise<void>((r) => {
      terminateResolve = r;
    });

  const _done = mw(context, async () => {
    const transform = context.transformSocket as ((s: TypedSocket) => TypedSocket) | undefined;
    if (transform) {
      const wrapped = transform(typed);
      Object.assign(typed, { _wrapped: wrapped });
    }
  });

  await vi.waitFor(() => expect(terminateResolve).toBeDefined());

  const disconnectFn = typed.listeners.get('disconnect');
  return { disconnectFn, terminateResolve };
}

describe('resumable middleware', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sets transformSocket on context before next()', async () => {
    const mw = resumable();
    const context = makeContext('key-1');

    let transformSet = false;
    await mw(context, async () => {
      transformSet = typeof context.transformSocket === 'function';
    });

    expect(transformSet).toBe(true);
  });

  it('first connection creates a ResumableSocket', async () => {
    const mw = resumable();
    const context = makeContext('key-1');
    const typed = makeTypedSocket();

    await runMiddleware(mw, context, typed);

    const transform = context.transformSocket as (s: TypedSocket) => TypedSocket;
    expect(transform).toBeDefined();
  });

  it('reconnect with same sessionKey rebinds existing ResumableSocket', async () => {
    const mw = resumable({ ttlMs: 60_000 });

    const ctx1 = makeContext('key-1');
    const typed1 = makeTypedSocket('s-1');
    const { disconnectFn: dc1, terminateResolve: tr1 } = await runMiddleware(mw, ctx1, typed1);

    const transform1 = ctx1.transformSocket as (s: TypedSocket) => TypedSocket;
    const resumable1 = transform1(typed1);
    resumable1.emit('e', { n: 1 });
    resumable1.emit('e', { n: 2 });

    dc1?.();
    tr1?.();
    await vi.advanceTimersByTimeAsync(0);

    const ctx2 = makeContext('key-1');
    const typed2 = makeTypedSocket('s-2');
    await runMiddleware(mw, ctx2, typed2);

    const transform2 = ctx2.transformSocket as (s: TypedSocket) => TypedSocket;
    const _resumable2 = transform2(typed2);

    typed2.emit.mockClear();
    const resumeListener = typed2.listeners.get('__resume__');
    resumeListener?.({ lastSeq: 1 });

    expect(typed2.emit).toHaveBeenCalledWith('e', { n: 2 });
  });

  it('resume gap emits state:refresh_required', async () => {
    const mw = resumable({ bufferSize: 1, ttlMs: 60_000 });

    const ctx1 = makeContext('key-1');
    const typed1 = makeTypedSocket('s-1');
    const { disconnectFn: dc1, terminateResolve: tr1 } = await runMiddleware(mw, ctx1, typed1);

    const transform1 = ctx1.transformSocket as (s: TypedSocket) => TypedSocket;
    const resumable1 = transform1(typed1);
    resumable1.emit('e', { n: 1 });
    resumable1.emit('e', { n: 2 });

    dc1?.();
    tr1?.();
    await vi.advanceTimersByTimeAsync(0);

    const ctx2 = makeContext('key-1');
    const typed2 = makeTypedSocket('s-2');
    await runMiddleware(mw, ctx2, typed2);

    const transform2 = ctx2.transformSocket as (s: TypedSocket) => TypedSocket;
    const _resumable2 = transform2(typed2);

    typed2.emit.mockClear();
    const resumeListener = typed2.listeners.get('__resume__');
    resumeListener?.({ lastSeq: 0 });

    expect(typed2.emit).toHaveBeenCalledWith('state:refresh_required', {});
  });

  it('TTL expires removes session from registry', async () => {
    const mw = resumable({ ttlMs: 5_000 });

    const ctx1 = makeContext('key-1');
    const typed1 = makeTypedSocket('s-1');
    const { disconnectFn: dc1, terminateResolve: tr1 } = await runMiddleware(mw, ctx1, typed1);

    const transform1 = ctx1.transformSocket as (s: TypedSocket) => TypedSocket;
    const resumable1 = transform1(typed1);
    resumable1.emit('e', { data: 1 });

    dc1?.();
    tr1?.();
    await vi.advanceTimersByTimeAsync(5_001);

    const ctx2 = makeContext('key-1');
    const typed2 = makeTypedSocket('s-2');
    await runMiddleware(mw, ctx2, typed2);

    const transform2 = ctx2.transformSocket as (s: TypedSocket) => TypedSocket;
    const _resumable2 = transform2(typed2);

    typed2.emit.mockClear();
    const resumeListener = typed2.listeners.get('__resume__');
    resumeListener?.({ lastSeq: 0 });

    expect(typed2.emit).not.toHaveBeenCalledWith('e', expect.anything());
  });

  it('reconnect before TTL cancels timer', async () => {
    const mw = resumable({ ttlMs: 5_000 });

    const ctx1 = makeContext('key-1');
    const typed1 = makeTypedSocket('s-1');
    const { disconnectFn: dc1, terminateResolve: tr1 } = await runMiddleware(mw, ctx1, typed1);

    const transform1 = ctx1.transformSocket as (s: TypedSocket) => TypedSocket;
    const resumable1 = transform1(typed1);
    resumable1.emit('e', { data: 1 });

    dc1?.();
    tr1?.();
    await vi.advanceTimersByTimeAsync(2_000);

    const ctx2 = makeContext('key-1');
    const typed2 = makeTypedSocket('s-2');
    await runMiddleware(mw, ctx2, typed2);

    await vi.advanceTimersByTimeAsync(10_000);

    const ctx3 = makeContext('key-1');
    const typed3 = makeTypedSocket('s-3');
    const { disconnectFn: _dc3, terminateResolve: _tr3 } = await runMiddleware(mw, ctx3, typed3);

    const transform3 = ctx3.transformSocket as (s: TypedSocket) => TypedSocket;
    const _resumable3 = transform3(typed3);

    typed3.emit.mockClear();
    const resumeListener = typed3.listeners.get('__resume__');
    resumeListener?.({ lastSeq: 0 });

    expect(typed3.emit).toHaveBeenCalledWith('e', { data: 1 });
  });

  describe('onRebind callback', () => {
    it('fires onRebind with (newSocket, previousSocketId) when client reconnects within TTL', async () => {
      const onRebind = vi.fn();
      const mw = resumable({ ttlMs: 60_000, onRebind });

      const ctx1 = makeContext('key-1');
      const typed1 = makeTypedSocket('s-1');
      const { disconnectFn: dc1, terminateResolve: tr1 } = await runMiddleware(mw, ctx1, typed1);

      dc1?.();
      tr1?.();
      await vi.advanceTimersByTimeAsync(0);

      const ctx2 = makeContext('key-1');
      const typed2 = makeTypedSocket('s-2');
      await runMiddleware(mw, ctx2, typed2);
      // _wrapped is set by runMiddleware's next() call
      const reboundSocket = (typed2 as { _wrapped?: TypedSocket })._wrapped;

      expect(onRebind).toHaveBeenCalledOnce();
      expect(onRebind).toHaveBeenCalledWith(reboundSocket, 's-1');
    });

    it('does not fire onRebind on first connection', async () => {
      const onRebind = vi.fn();
      const mw = resumable({ onRebind });
      const ctx = makeContext('key-1');
      const typed = makeTypedSocket('s-1');
      await runMiddleware(mw, ctx, typed);

      expect(onRebind).not.toHaveBeenCalled();
    });

    it('does not fire onRebind after TTL expires', async () => {
      const onRebind = vi.fn();
      const mw = resumable({ ttlMs: 5_000, onRebind });

      const ctx1 = makeContext('key-1');
      const typed1 = makeTypedSocket('s-1');
      const { disconnectFn: dc1, terminateResolve: tr1 } = await runMiddleware(mw, ctx1, typed1);

      dc1?.();
      tr1?.();
      await vi.advanceTimersByTimeAsync(5_001);

      const ctx2 = makeContext('key-1');
      const typed2 = makeTypedSocket('s-2');
      await runMiddleware(mw, ctx2, typed2);

      expect(onRebind).not.toHaveBeenCalled();
    });
  });

  describe('onExpire callback', () => {
    it('fires onExpire with socketId when TTL expires', async () => {
      const onExpire = vi.fn();
      const mw = resumable({ ttlMs: 5_000, onExpire });

      const ctx1 = makeContext('key-1');
      const typed1 = makeTypedSocket('s-1');
      const { disconnectFn: dc1, terminateResolve: tr1 } = await runMiddleware(mw, ctx1, typed1);
      const rs = (typed1 as { _wrapped?: TypedSocket })._wrapped;

      dc1?.();
      tr1?.();
      await vi.advanceTimersByTimeAsync(5_001);

      expect(onExpire).toHaveBeenCalledOnce();
      expect(onExpire).toHaveBeenCalledWith(rs?.id ?? typed1.id);
    });

    it('does not fire onExpire if reconnect cancels the timer', async () => {
      const onExpire = vi.fn();
      const mw = resumable({ ttlMs: 5_000, onExpire });

      const ctx1 = makeContext('key-1');
      const typed1 = makeTypedSocket('s-1');
      const { disconnectFn: dc1, terminateResolve: tr1 } = await runMiddleware(mw, ctx1, typed1);

      dc1?.();
      tr1?.();
      await vi.advanceTimersByTimeAsync(2_000);

      const ctx2 = makeContext('key-1');
      const typed2 = makeTypedSocket('s-2');
      await runMiddleware(mw, ctx2, typed2);

      await vi.advanceTimersByTimeAsync(10_000);

      expect(onExpire).not.toHaveBeenCalled();
    });
  });

  it('anonymous connection without sessionKey is not stored in registry', async () => {
    const mw = resumable();
    const ctx = makeContext();
    const typed = makeTypedSocket();

    await runMiddleware(mw, ctx, typed);

    const transform = ctx.transformSocket as (s: TypedSocket) => TypedSocket;
    const wrapped = transform(typed);

    expect(wrapped).toBeDefined();
    expect(wrapped.id).toBe(typed.id);
  });
});
