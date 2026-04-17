import type { ServerToClientEvents } from '@code-quest/shared';
import type { TypedSocket } from '@/socket/client';
import { matchesChannel, type Payload } from './handlers/guard';

interface RegisterOptions<D> {
  beforeUpdate?: (event: string, payload: { channelId: string }) => void;
  skipGuard?: Set<string>;
  effects?: Record<string, (deps: D, payload: never) => void>;
  effectDeps?: D;
}

type SocketListener = (payload: { channelId: string }) => void;

interface EventRegistration {
  /** Consumer-registered listeners that fan out from the shared `bound`. */
  listeners: Set<SocketListener>;
  /** The single function attached via `socket.on(event, bound)`. */
  bound: SocketListener;
}

/**
 * Per-channel socket event router. Deduplicates `socket.on` subscriptions so
 * multiple contexts registering the same event share one underlying listener.
 * Owns channelId-guard and state/effect fan-out.
 */
export class ChannelSocketRouter {
  private events = new Map<string, EventRegistration>();

  constructor(
    private socket: TypedSocket,
    private channelId: string,
  ) {}

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
      const guarded = !skipGuard?.has(event);
      const wrapped: SocketListener = (payload) => {
        if (guarded && !matchesChannel(this.channelId, payload)) return;
        beforeUpdate?.(event, payload);
        if (stateHandler) setState((prev) => stateHandler(prev, payload as never));
        if (effectHandler && effectDeps !== undefined) effectHandler(effectDeps, payload as never);
      };
      this.addListener(event, wrapped);
      return () => this.removeListener(event, wrapped);
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
    const wrapped: SocketListener = (payload) => {
      if (!matchesChannel(this.channelId, payload)) return;
      listener(payload as Payload<E>);
    };
    this.addListener(event as string, wrapped);
    return () => this.removeListener(event as string, wrapped);
  }

  dispose() {
    for (const [event, entry] of this.events) {
      this.socket.off(event as never, entry.bound as never);
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
      this.socket.on(event as never, bound as never);
    }
    entry.listeners.add(listener);
  }

  private removeListener(event: string, listener: SocketListener) {
    const entry = this.events.get(event);
    if (!entry) return;
    entry.listeners.delete(listener);
    if (entry.listeners.size === 0) {
      this.socket.off(event as never, entry.bound as never);
      this.events.delete(event);
    }
  }
}
