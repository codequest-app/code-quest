import { type Envelope, PONG_JSON, parseEnvelope } from '../transport/envelope.ts';

export interface RpcSocket {
  send(data: string): void;
  onMessage(fn: (data: string) => void): void;
  onClose(fn: () => void): void;
}

export const RESUME_EVENT = '__resume__';
const UNSEQUENCED = 0;

const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;

type RequestHandler = (data: unknown) => Promise<unknown>;
type PendingCall = {
  resolve: (result: unknown) => void;
  reject: (err: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

export interface RpcChannelOptions {
  requestTimeoutMs?: number;
}

export class RpcChannel {
  private readonly socket: RpcSocket;
  private readonly requestTimeoutMs: number;
  private readonly handlers = new Map<string, RequestHandler>();
  private readonly listeners = new Map<string, Set<(...args: unknown[]) => void>>();
  private readonly pending = new Map<string, PendingCall>();
  private nextId = 1;
  private closed = false;

  constructor(socket: RpcSocket, options?: RpcChannelOptions) {
    this.socket = socket;
    this.requestTimeoutMs = options?.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;

    socket.onMessage((raw) => this.handleMessage(raw));
    socket.onClose(() => this.handleClose());
  }

  request<R = unknown>(event: string, data: unknown): Promise<R> {
    if (this.closed) return Promise.reject(new Error('RpcChannel closed'));
    const id = String(this.nextId++);
    return new Promise<R>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`RPC timeout: ${event} (id=${id})`));
      }, this.requestTimeoutMs);
      this.pending.set(id, {
        resolve: resolve as (v: unknown) => void,
        reject,
        timer,
      });
      const env: Envelope = { kind: 'request', id, event, data };
      this.socket.send(JSON.stringify(env));
    });
  }

  onRequest(event: string, handler: RequestHandler): () => void {
    this.handlers.set(event, handler);
    return () => this.handlers.delete(event);
  }

  emit(event: string, data: unknown): void {
    if (this.closed) return;
    const env: Envelope = { kind: 'event', seq: UNSEQUENCED, event, data };
    this.socket.send(JSON.stringify(env));
  }

  on(event: string, fn: (...args: unknown[]) => void): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(fn);
    return () => set.delete(fn);
  }

  close(): void {
    this.handleClose();
  }

  private handleMessage(raw: string): void {
    const env = parseEnvelope(raw);
    if (!env) return;

    switch (env.kind) {
      case 'ping':
        this.socket.send(PONG_JSON);
        return;
      case 'pong':
        return;
      case 'resume':
        this.fireEvent(RESUME_EVENT, { lastSeq: env.lastSeq });
        return;
      case 'event':
        this.fireEvent(env.event, env.data);
        return;
      case 'request':
        this.handleRequest(env.id, env.event, env.data);
        return;
      case 'response':
        this.handleResponse(env);
        return;
    }
  }

  private async handleRequest(id: string, event: string, data: unknown): Promise<void> {
    const handler = this.handlers.get(event);
    if (!handler) {
      const response: Envelope = {
        kind: 'response',
        id,
        ok: false,
        error: `Unknown method: ${event}`,
      };
      this.socket.send(JSON.stringify(response));
      return;
    }
    try {
      const result = await handler(data);
      const response: Envelope = { kind: 'response', id, ok: true, data: result };
      this.socket.send(JSON.stringify(response));
    } catch (err) {
      const response: Envelope = {
        kind: 'response',
        id,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      };
      this.socket.send(JSON.stringify(response));
    }
  }

  private handleResponse(env: Extract<Envelope, { kind: 'response' }>): void {
    const pending = this.pending.get(env.id);
    if (!pending) return;
    clearTimeout(pending.timer);
    this.pending.delete(env.id);
    if (env.ok) {
      pending.resolve(env.data);
    } else {
      pending.reject(new Error(env.error ?? 'Unknown error'));
    }
  }

  private fireEvent(event: string, data?: unknown): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const fn of set) {
      if (data !== undefined) fn(data);
      else fn();
    }
  }

  private handleClose(): void {
    if (this.closed) return;
    this.closed = true;
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(new Error('RpcChannel closed'));
    }
    this.pending.clear();
    this.fireEvent('disconnect');
    this.listeners.clear();
    this.handlers.clear();
  }
}
