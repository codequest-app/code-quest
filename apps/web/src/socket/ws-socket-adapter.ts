import type { SocketLike } from './client.ts';
import type { WsClient } from './ws-client.ts';

type Listener = (...args: unknown[]) => void;

/**
 * Translates the socket.io-client `Socket` API surface that code-quest actually
 * uses (`connect/disconnect/on/off/emit/connected/id` plus the special events
 * `connect` / `connect_error`) onto a `WsClient` instance. This lets existing
 * hook code (SessionContext, ChannelMessages, etc.) run unchanged when
 * `VITE_TRANSPORT=ws` selects the raw-WebSocket path.
 *
 * Two semantic translations matter:
 *   - `emit(event, ...args, callback)` where the trailing `callback` is a
 *     function → routed to `WsClient.request()`. The ack value handed to the
 *     callback uses the project's `RpcResult` shape (`{ ok, data | error }`).
 *   - `on('connect' | 'connect_error', fn)` are tracked locally rather than
 *     sent over the wire, since they're transport lifecycle events.
 */
export class WsSocketAdapter implements SocketLike {
  connected = false;
  id = '';

  private connectListeners = new Set<Listener>();
  private connectErrorListeners = new Set<Listener>();
  /** Listener bag tracked here so off() can find the same fn we registered with WsClient. */
  private listenerOff = new Map<Listener, () => void>();
  private readonly client: WsClient;

  constructor(client: WsClient) {
    this.client = client;
  }

  connect(): void {
    // Wire lifecycle BEFORE opening the socket so the very first onOpen is
    // observed. Real `WebSocket` open is async (no race in production), but
    // ordering this way removes the implicit dependency on that timing.
    this.bindLifecycle();
    this.client.connect();
  }

  disconnect(): void {
    this.connected = false;
    this.client.disconnect();
  }

  emit(event: string, ...args: unknown[]): void {
    const last = args[args.length - 1];
    const hasCallback = typeof last === 'function';
    if (hasCallback) {
      const cb = last as Listener;
      const payload = args.length > 1 ? args[0] : undefined;
      this.client.request(event, payload).then(
        (data) => cb(data),
        (err) => {
          // Transport-level rejection (disconnect, ok:false envelope, etc.):
          // do NOT invoke cb. Matches socket.io's emitWithAck-without-timeout
          // behavior — callers waiting for an ack just keep waiting, no
          // synthetic error payload is fabricated.
          console.debug('[WsSocketAdapter] request rejected', event, err);
        },
      );
      return;
    }
    const payload = args[0];
    this.client.emit(event, payload);
  }

  on(event: string, fn: Listener): void {
    if (event === 'connect') {
      this.connectListeners.add(fn);
      if (this.connected) queueMicrotask(() => fn());
      return;
    }
    if (event === 'connect_error') {
      this.connectErrorListeners.add(fn);
      return;
    }
    const off = this.client.on(event, fn);
    this.listenerOff.set(fn, off);
  }

  off(event: string, fn: Listener): void {
    if (event === 'connect') {
      this.connectListeners.delete(fn);
      return;
    }
    if (event === 'connect_error') {
      this.connectErrorListeners.delete(fn);
      return;
    }
    const off = this.listenerOff.get(fn);
    if (off) {
      off();
      this.listenerOff.delete(fn);
    }
  }

  // ── Internals ──

  private bindLifecycle(): void {
    // Bridge WsClient's lifecycle (a typed { onOpen, onClose } interface
    // surfaced via setLifecycleListener) to the socket.io-shaped 'connect'
    // and 'connect_error' events that consumer code listens for.
    this.client.setLifecycleListener({
      onOpen: (id) => {
        this.connected = true;
        this.id = id;
        for (const l of this.connectListeners) l();
      },
      onClose: () => {
        if (!this.connected) {
          for (const l of this.connectErrorListeners) l(new Error('connect_error'));
        }
        this.connected = false;
      },
    });
  }
}
