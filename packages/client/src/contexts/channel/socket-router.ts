import type { ServerToClientEvents } from '@code-quest/shared';
import type { TypedSocket } from '@/socket/client';
import { matchesChannel, type Payload } from './handlers/guard.ts';

interface RegisterOptions<D> {
  beforeUpdate?: (event: string, payload: { channelId: string }) => void;
  skipGuard?: Set<string>;
  effects?: Record<string, (deps: D, payload: never) => void>;
  effectDeps?: D;
}

type SocketListener = (payload: { channelId: string }) => void;

/**
 * Thin subscription surface that `ChannelSocketRouter` talks to. Decouples
 * the router from socket.io's typed-event API, isolates the required
 * `as never` casts in one place (`createSocketAdapter`), and lets tests
 * plug in a fake adapter without mocking the full `TypedSocket` surface.
 */
export interface SubscriptionAdapter {
  on(event: string, fn: SocketListener): void;
  off(event: string, fn: SocketListener): void;
}

/**
 * Wrap a `TypedSocket` into the `SubscriptionAdapter` shape. The two
 * `as never` casts exist because socket.io's typed `on`/`off` reject
 * `string` in favor of literal event keys — we bridge dynamic dispatch
 * here so the router class body stays cast-free.
 */
export function createSocketAdapter(socket: TypedSocket): SubscriptionAdapter {
  return {
    on: (event, fn) => socket.on(event as never, fn as never),
    off: (event, fn) => socket.off(event as never, fn as never),
  };
}

interface EventRegistration {
  /** Consumer-registered listeners that fan out from the shared `bound`. */
  listeners: Set<SocketListener>;
  /** The single function attached via `adapter.on(event, bound)`. */
  bound: SocketListener;
}

/**
 * Per-channel socket event router. Deduplicates `adapter.on` subscriptions
 * so multiple contexts registering the same event share one underlying
 * listener. Owns channelId-guard and state/effect fan-out.
 */
export class ChannelSocketRouter {
  private events = new Map<string, EventRegistration>();
  private adapter: SubscriptionAdapter;
  private channelId: string;

  constructor(adapter: SubscriptionAdapter, channelId: string) {
    this.adapter = adapter;
    this.channelId = channelId;
  }

  register<S, D = never>(
    handlers: Record<string, (state: S, payload: never) => S>,
    setState: (fn: (prev: S) => S) => void,
    options?: RegisterOptions<D>,
  ): () => void {
    const { beforeUpdate, skipGuard, effects, effectDeps } = options ?? {};
    const events = new Set([...Object.keys(handlers), ...Object.keys(effects ?? {})]);

    const offs = [...events].map((event) => {
      const stateHandler = handlers[event];
      const effectHandler = effects?.[event];
      const handleEvent: SocketListener = (payload) => {
        beforeUpdate?.(event, payload);
        if (stateHandler) setState((prev) => stateHandler(prev, payload as never));
        if (effectHandler && effectDeps !== undefined) effectHandler(effectDeps, payload as never);
      };
      return this.subscribe(event, handleEvent, !skipGuard?.has(event));
    });

    return () => {
      for (const off of offs) off();
    };
  }

  /**
   * Register a raw typed listener for a single event, guarded by channelId
   * match against `payload.channelId`. Use for events whose payload carries
   * a top-level `channelId` (e.g., control:*, message:result). Broadcast
   * events without a top-level channelId should not go through this router.
   */
  on<E extends keyof ServerToClientEvents>(
    event: E,
    listener: (payload: Payload<E>) => void,
  ): () => void {
    return this.subscribe(event as string, (payload) => listener(payload as Payload<E>));
  }

  // Single guard-wrap site for both `on` and `register`. `guarded: false`
  // exists for handler-map events (e.g., 'disconnect') whose payload lacks a
  // channelId.
  private subscribe(event: string, listener: SocketListener, guarded = true): () => void {
    const wrapped: SocketListener = guarded
      ? (payload) => {
          if (matchesChannel(this.channelId, payload)) listener(payload);
        }
      : listener;
    this.addListener(event, wrapped);
    return () => this.removeListener(event, wrapped);
  }

  dispose(): void {
    for (const [event, entry] of this.events) {
      this.adapter.off(event, entry.bound);
    }
    this.events.clear();
  }

  private addListener(event: string, listener: SocketListener) {
    let entry = this.events.get(event);
    if (!entry) {
      const listeners = new Set<SocketListener>();
      const bound: SocketListener = (payload) => {
        for (const fn of listeners) fn(payload);
      };
      entry = { listeners, bound };
      this.events.set(event, entry);
      this.adapter.on(event, bound);
    }
    entry.listeners.add(listener);
  }

  private removeListener(event: string, listener: SocketListener) {
    const entry = this.events.get(event);
    if (!entry) return;
    entry.listeners.delete(listener);
    if (entry.listeners.size === 0) {
      this.adapter.off(event, entry.bound);
      this.events.delete(event);
    }
  }
}
