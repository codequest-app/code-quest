import type { JsonRpcResponse, RemoteNotification } from '@code-quest/shared';
import { createHeartbeat, isRecord } from '@code-quest/shared';
import type { WebSocket } from 'ws';
import { logger } from '../logger.ts';

function isNotification(msg: object): msg is RemoteNotification {
  return (
    !('id' in msg) &&
    'method' in msg &&
    typeof (msg as Record<string, unknown>).method === 'string' &&
    'params' in msg
  );
}

function isResponse(msg: object): msg is JsonRpcResponse {
  return 'id' in msg && !('method' in msg);
}

const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;

type PendingCall = {
  resolve: (result: unknown) => void;
  reject: (err: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

export class Connection {
  private nextId = 1;
  private readonly pending = new Map<number | string, PendingCall>();
  private readonly notificationListeners = new Set<(n: RemoteNotification) => void>();
  private readonly disconnectListeners = new Set<() => void>();
  private ws: WebSocket;
  private heartbeat: ReturnType<typeof createHeartbeat>;
  private readonly pongTimeoutMs: number;
  private readonly requestTimeoutMs: number;

  constructor(
    ws: WebSocket,
    pongTimeoutMs = 60_000,
    requestTimeoutMs: number = DEFAULT_REQUEST_TIMEOUT_MS,
  ) {
    this.pongTimeoutMs = pongTimeoutMs;
    this.requestTimeoutMs = requestTimeoutMs;
    this.ws = ws;
    this.heartbeat = this.buildHeartbeat(ws);
    this.wireSocket(ws);
  }

  replaceSocket(ws: WebSocket): void {
    this.stopHeartbeat();
    this.unwireSocket();
    this.ws = ws;
    this.heartbeat = this.buildHeartbeat(ws);
    this.wireSocket(ws);
    this.startHeartbeat();
  }

  private buildHeartbeat(ws: WebSocket) {
    return createHeartbeat(ws, {
      pongTimeoutMs: this.pongTimeoutMs,
      onTimeout: () => logger.warn('remote daemon pong timeout — terminating'),
    });
  }

  private onMessage = (raw: Buffer) => this.handleMessage(raw.toString());
  private onClose = () => {
    logger.info('remote daemon disconnected');
    this.stopHeartbeat();
    this.rejectAll(new Error('Remote daemon disconnected'));
    for (const fn of this.disconnectListeners) fn();
  };
  private onError = (err: Error) => {
    logger.error({ err }, 'remote daemon WS error');
  };

  private wireSocket(ws: WebSocket): void {
    ws.on('message', this.onMessage);
    ws.on('close', this.onClose);
    ws.on('error', this.onError);
  }

  private unwireSocket(): void {
    this.ws.off('message', this.onMessage);
    this.ws.off('close', this.onClose);
    this.ws.off('error', this.onError);
  }

  private handleMessage(raw: string): void {
    let msg: unknown;
    try {
      msg = JSON.parse(raw);
    } catch {
      logger.warn({ raw }, 'remote: unparseable message');
      return;
    }

    if (!isRecord(msg)) return;

    if (isNotification(msg)) {
      for (const fn of this.notificationListeners) {
        fn(msg);
      }
      return;
    }

    if (isResponse(msg)) {
      const response = msg;
      const pending = this.pending.get(response.id);
      if (!pending) return;
      clearTimeout(pending.timer);
      this.pending.delete(response.id);
      if (response.error) {
        pending.reject(new Error(response.error.message));
      } else {
        pending.resolve(response.result);
      }
    }
  }

  request<R = unknown>(method: string, params: unknown): Promise<R> {
    if (this.ws.readyState !== this.ws.OPEN) {
      return Promise.reject(new Error('No remote daemon connected'));
    }
    const id = this.nextId++;
    return new Promise<R>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`RPC timeout: ${method} (id=${id})`));
      }, this.requestTimeoutMs);
      this.pending.set(id, {
        resolve: resolve as (v: unknown) => void,
        reject,
        timer,
      });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  onNotification(fn: (n: RemoteNotification) => void): () => void {
    this.notificationListeners.add(fn);
    return () => {
      this.notificationListeners.delete(fn);
    };
  }

  onDisconnect(fn: () => void): () => void {
    this.disconnectListeners.add(fn);
    return () => {
      this.disconnectListeners.delete(fn);
    };
  }

  startHeartbeat(intervalMs?: number): void {
    this.heartbeat.start(intervalMs ?? 30_000);
  }

  stopHeartbeat(): void {
    this.heartbeat.stop();
  }

  close(): void {
    this.stopHeartbeat();
    this.ws.close();
  }

  get isOpen(): boolean {
    return this.ws.readyState === this.ws.OPEN;
  }

  private rejectAll(err: Error): void {
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(err);
    }
    this.pending.clear();
  }
}
