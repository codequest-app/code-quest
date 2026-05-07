import { type Envelope, EnvelopeSchema } from '@code-quest/shared';

interface WsClientOptions {
  /** First reconnect delay in ms (doubles on each successive failure). Default 500. */
  initialBackoffMs?: number;
  /** Cap for backoff. Default 10_000. */
  maxBackoffMs?: number;
  /** Idle ping interval in ms. Default 25_000. */
  pingIntervalMs?: number;
  /** Outbox cap; oldest message dropped on overflow. Default 100. */
  outboxLimit?: number;
}

type EventListener = (data: unknown) => void;

interface LifecycleListener {
  onOpen(id: string): void;
  onClose(): void;
}

interface PendingRequest {
  resolve: (data: unknown) => void;
  reject: (err: Error) => void;
}

type QueuedEnvelope =
  | { kind: 'event'; event: string; data: unknown }
  | { kind: 'request'; id: string; event: string; data: unknown };

/**
 * WsClient — browser-side raw WebSocket client speaking the project envelope
 * protocol. Provides the surface area existing code expects from a socket.io
 * client: connect/disconnect/on/off/emit + a Promise-based request/response.
 *
 * Resilience:
 *   - Outbox queues outgoing envelopes while disconnected, flushes on OPEN.
 *   - Exponential backoff reconnect (500 → 1000 → 2000 → … cap 10s) with jitter.
 *   - Resume envelope sent on each successful (re)open, carrying the highest
 *     received seq so the server (above-transport ResumableSocket) can replay.
 *   - Idle ping every pingIntervalMs to keep proxies from idle-killing.
 */
export class WsClient {
  private ws?: WebSocket;
  private outbox: QueuedEnvelope[] = [];
  private pending = new Map<string, PendingRequest>();
  private listeners = new Map<string, Set<EventListener>>();
  private lastSeq = 0;
  private backoffMs: number;
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private pingTimer?: ReturnType<typeof setInterval>;
  private explicitlyClosed = false;
  private lifecycle?: LifecycleListener;
  private currentId = '';
  private readonly opts: Required<WsClientOptions>;
  private readonly url: string;

  constructor(url: string, opts: WsClientOptions = {}) {
    this.url = url;
    this.opts = {
      initialBackoffMs: opts.initialBackoffMs ?? 500,
      maxBackoffMs: opts.maxBackoffMs ?? 10_000,
      pingIntervalMs: opts.pingIntervalMs ?? 25_000,
      outboxLimit: opts.outboxLimit ?? 100,
    };
    this.backoffMs = this.opts.initialBackoffMs;
    this.bindVisibilityChange();
  }

  connect(): void {
    // Idempotent while a socket is alive. Without this guard, a second
    // connect() would orphan the first WebSocket — its onopen would still
    // fire and write to the stale `this.ws` reference, racing with the new one.
    if (this.ws && this.ws.readyState !== this.ws.CLOSED) return;
    this.explicitlyClosed = false;
    this.openSocket();
  }

  disconnect(): void {
    this.explicitlyClosed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.pingTimer) clearInterval(this.pingTimer);
    if (this.ws && this.ws.readyState !== this.ws.CLOSED) this.ws.close(1000);
    // Pending request promises are still in the `pending` map; without this
    // they would hang forever once the user has explicitly given up.
    for (const p of this.pending.values()) p.reject(new Error('disconnected'));
    this.pending.clear();
  }

  emit(event: string, data: unknown): void {
    const env: QueuedEnvelope = { kind: 'event', event, data };
    if (this.isOpen()) this.sendNow(this.toEnvelope(env));
    else this.enqueue(env);
  }

  request<T = unknown>(event: string, data: unknown): Promise<T> {
    const id = randomId();
    const queued: QueuedEnvelope = { kind: 'request', id, event, data };
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, {
        resolve: resolve as (d: unknown) => void,
        reject,
      });
      if (this.isOpen()) this.sendNow(this.toEnvelope(queued));
      else this.enqueue(queued);
    });
  }

  on(event: string, fn: EventListener): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(fn);
    return () => set.delete(fn);
  }

  off(event: string, fn: EventListener): void {
    this.listeners.get(event)?.delete(fn);
  }

  /**
   * Subscribe to connection lifecycle. The adapter uses this to surface
   * 'connect' / 'connect_error' events to the socket.io-shaped consumer code.
   */
  setLifecycleListener(listener: LifecycleListener): void {
    this.lifecycle = listener;
  }

  /**
   * Test-only: simulate network-level connection drop. Does NOT set
   * explicitlyClosed, so the reconnect logic kicks in and a fresh WebSocket
   * is created via the configured backoff.
   */
  forceCloseUnderlying(): void {
    if (!this.ws) return;
    if ('terminate' in this.ws && typeof this.ws.terminate === 'function') this.ws.terminate();
    else this.ws.close(4001, 'forced');
  }

  // ── Internals ──

  private openSocket(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
    const ws = new WebSocket(this.url);
    this.ws = ws;
    ws.onopen = () => this.handleOpen();
    ws.onmessage = (ev) => this.handleMessage(ev);
    ws.onclose = (ev) => this.handleClose(ev);
    ws.onerror = () => {
      /* swallow; close will follow */
    };
  }

  private handleOpen(): void {
    this.backoffMs = this.opts.initialBackoffMs;
    this.currentId = randomId();
    // Send resume FIRST so the server replays missed events before our queued
    // outbound work executes against potentially-stale state.
    this.sendNow({ kind: 'resume', lastSeq: this.lastSeq });
    for (const q of this.outbox) {
      this.sendNow(this.toEnvelope(q));
    }
    this.outbox = [];
    this.startPingTimer();
    this.lifecycle?.onOpen(this.currentId);
  }

  private handleMessage(ev: MessageEvent): void {
    let parsed: unknown;
    try {
      parsed = JSON.parse(typeof ev.data === 'string' ? ev.data : String(ev.data));
    } catch {
      console.warn('[WsClient] received non-JSON message', ev.data);
      return;
    }
    const result = EnvelopeSchema.safeParse(parsed);
    if (!result.success) return;
    const env = result.data;

    switch (env.kind) {
      case 'event':
        if (env.seq > this.lastSeq) this.lastSeq = env.seq;
        this.fireListener(env.event, env.data);
        return;
      case 'response': {
        const p = this.pending.get(env.id);
        if (!p) return;
        this.pending.delete(env.id);
        if (env.ok) p.resolve(env.data);
        else p.reject(new Error(env.error ?? 'request failed'));
        return;
      }
      case 'pong':
      case 'ping':
      case 'request':
      case 'resume':
        return;
    }
  }

  private handleClose(_ev: CloseEvent): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = undefined;
    }
    this.lifecycle?.onClose();
    if (this.explicitlyClosed) return;
    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    const jitter = 1 + (Math.random() * 0.4 - 0.2);
    const delay = Math.min(this.backoffMs * jitter, this.opts.maxBackoffMs);
    this.reconnectTimer = setTimeout(() => this.openSocket(), delay);
    this.backoffMs = Math.min(this.backoffMs * 2, this.opts.maxBackoffMs);
  }

  /**
   * When the tab becomes visible after being backgrounded, mobile + power-saving
   * scenarios often delay timer firing. Treat visibility return as a hint to
   * reconnect immediately rather than wait out the remaining backoff.
   */
  private bindVisibilityChange(): void {
    if (typeof document === 'undefined') return;
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') return;
      if (this.isOpen() || this.explicitlyClosed) return;
      if (!this.reconnectTimer) return;
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
      this.backoffMs = this.opts.initialBackoffMs;
      this.openSocket();
    });
  }

  private startPingTimer(): void {
    if (this.pingTimer) clearInterval(this.pingTimer);
    this.pingTimer = setInterval(() => {
      if (this.isOpen()) this.sendNow({ kind: 'ping' });
    }, this.opts.pingIntervalMs);
  }

  private isOpen(): boolean {
    return !!this.ws && this.ws.readyState === this.ws.OPEN;
  }

  private sendNow(env: Envelope): void {
    this.ws?.send(JSON.stringify(env));
  }

  private toEnvelope(q: QueuedEnvelope): Envelope {
    if (q.kind === 'event') {
      // Client→server `seq` is a placeholder (server doesn't read it; spec D9
      // says seq is meaningful only server→client). Schema requires int>=0.
      return { kind: 'event', seq: 0, event: q.event, data: q.data };
    }
    return { kind: 'request', id: q.id, event: q.event, data: q.data };
  }

  private enqueue(q: QueuedEnvelope): void {
    if (this.outbox.length >= this.opts.outboxLimit) {
      const dropped = this.outbox.shift();
      if (dropped?.kind === 'request') {
        const p = this.pending.get(dropped.id);
        if (p) {
          this.pending.delete(dropped.id);
          p.reject(new Error('outbox overflow'));
        }
      }
    }
    this.outbox.push(q);
  }

  private fireListener(event: string, data: unknown): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const fn of set) {
      try {
        fn(data);
      } catch (err) {
        console.warn('[WsClient] listener error', event, err);
      }
    }
  }
}

function randomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `r-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
