import type { ServerToClientEvents } from '@code-quest/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChannelSocketRouter, type SubscriptionAdapter } from '../socket-router';

type Payload = { channelId: string } & Record<string, unknown>;
type Listener = (payload: Payload) => void;

/** Test-only extension: production code never emits through the adapter or
 * inspects listener counts; those methods exist to drive assertions. */
interface TestAdapter extends SubscriptionAdapter {
  emit(event: string, payload: Payload): void;
  listenerCount(event: string): number;
}

function fakeAdapter(): TestAdapter {
  const listeners = new Map<string, Set<Listener>>();
  return {
    on(event, fn) {
      const set = listeners.get(event) ?? new Set<Listener>();
      set.add(fn as Listener);
      listeners.set(event, set);
    },
    off(event, fn) {
      listeners.get(event)?.delete(fn as Listener);
    },
    emit(event, payload) {
      for (const fn of listeners.get(event) ?? []) fn(payload);
    },
    listenerCount(event) {
      return listeners.get(event)?.size ?? 0;
    },
  };
}

// Aliases narrow `keyof ServerToClientEvents` to the event keys we use in
// tests, preserving the router's typed API without `as any` at every call site.
const PERMISSION = 'control:permission' satisfies keyof ServerToClientEvents;
const MESSAGE_RESULT = 'message:result' satisfies keyof ServerToClientEvents;
const SESSION_CLOSED = 'session:closed' satisfies keyof ServerToClientEvents;

describe('ChannelSocketRouter', () => {
  let adapter: TestAdapter;
  let router: ChannelSocketRouter;

  beforeEach(() => {
    adapter = fakeAdapter();
    router = new ChannelSocketRouter(adapter, 'ch-A');
  });

  it('dedupes multiple on() registrations into a single adapter.on', () => {
    router.on(PERMISSION, () => {});
    router.on(PERMISSION, () => {});
    router.on(PERMISSION, () => {});

    expect(adapter.listenerCount(PERMISSION)).toBe(1);
  });

  it('fans out to every registered listener on emit', () => {
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    const fn3 = vi.fn();
    router.on(PERMISSION, fn1);
    router.on(PERMISSION, fn2);
    router.on(PERMISSION, fn3);

    adapter.emit(PERMISSION, { channelId: 'ch-A', data: 'x' });

    expect(fn1).toHaveBeenCalledOnce();
    expect(fn2).toHaveBeenCalledOnce();
    expect(fn3).toHaveBeenCalledOnce();
  });

  it('dispatches payloads with matching channelId', () => {
    const fn = vi.fn();
    router.on(PERMISSION, fn);

    adapter.emit(PERMISSION, { channelId: 'ch-A' });

    expect(fn).toHaveBeenCalledOnce();
  });

  it('rejects payloads with non-matching channelId', () => {
    const fn = vi.fn();
    router.on(PERMISSION, fn);

    adapter.emit(PERMISSION, { channelId: 'ch-B' });

    expect(fn).not.toHaveBeenCalled();
  });

  it('accepts payloads with empty-string channelId (broadcast-to-all)', () => {
    const fn = vi.fn();
    router.on(PERMISSION, fn);

    adapter.emit(PERMISSION, { channelId: '' });

    expect(fn).toHaveBeenCalledOnce();
  });

  it('register skipGuard bypasses channelId check for the named events', () => {
    const disconnectHandler = vi.fn((state: unknown) => state);
    let localState: unknown = 'initial';
    router.register<unknown>(
      { disconnect: disconnectHandler },
      (fn) => {
        localState = fn(localState);
      },
      { skipGuard: new Set(['disconnect']) },
    );

    // Payload has no matching channelId; without skipGuard this would be rejected.
    adapter.emit('disconnect', { channelId: 'ch-other' });

    expect(disconnectHandler).toHaveBeenCalledOnce();
  });

  it('removing the last listener for an event triggers adapter.off', () => {
    const off1 = router.on(PERMISSION, () => {});
    const off2 = router.on(PERMISSION, () => {});

    expect(adapter.listenerCount(PERMISSION)).toBe(1);

    off1();
    expect(adapter.listenerCount(PERMISSION)).toBe(1); // still listening

    off2();
    expect(adapter.listenerCount(PERMISSION)).toBe(0); // last removed
  });

  it('dispose detaches every remaining listener', () => {
    router.on(PERMISSION, () => {});
    router.on(MESSAGE_RESULT, () => {});
    router.on(SESSION_CLOSED, () => {});

    router.dispose();

    expect(adapter.listenerCount(PERMISSION)).toBe(0);
    expect(adapter.listenerCount(MESSAGE_RESULT)).toBe(0);
    expect(adapter.listenerCount(SESSION_CLOSED)).toBe(0);
  });
});
