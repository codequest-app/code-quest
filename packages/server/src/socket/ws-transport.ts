import { randomUUID } from 'node:crypto';
import type { Server as HttpServer, IncomingMessage } from 'node:http';
import { type Envelope, EnvelopeSchema } from '@code-quest/shared';
import { type WebSocket, WebSocketServer } from 'ws';
import { logger } from '../logger.ts';
import type { AuthContext, Authenticator } from './authenticator.ts';
import type { Transport, TransportHandle } from './transport.ts';
import type { SocketCallback, TypedSocket } from './types.ts';

export interface WsTransportOptions {
  authenticator: Authenticator;
  /** Path the WebSocket upgrade is served on. Default `/ws`. */
  path?: string;
  /** Server pings clients at this interval to keep proxies from idle-killing. Default 25_000 ms. */
  heartbeatIntervalMs?: number;
  /** Close socket if no traffic of any kind for this long. Default 60_000 ms. */
  idleTimeoutMs?: number;
}

interface SocketMeta {
  authContext: AuthContext;
  /** Per-socket outbound seq counter for `kind: 'event'` envelopes. */
  nextSeq: number;
  /** Pending listeners registered via `socket.on(event, fn)`. */
  listeners: Map<string, Set<(...args: unknown[]) => void>>;
  /** Last instant ANY frame was received (ms). Used for idle-timeout detection. */
  lastSeen: number;
  /** Outbound ping timer; reset on outbound traffic. */
  pingTimer?: ReturnType<typeof setInterval>;
  /** Idle deadline timer. */
  idleTimer?: ReturnType<typeof setInterval>;
  /** Optional sessionKey extracted from the upgrade request's URL query. */
  sessionKey?: string;
}

/** Synthetic event name fired on the TypedSocket when a `resume` envelope arrives. */
export const RESUME_EVENT = '__resume__';

/**
 * WsTransport — raw WebSocket implementation of the Transport contract.
 *
 * Wire format: JSON envelopes (see `packages/shared/src/transport/envelope.ts`).
 * Authentication: runs at HTTP upgrade time; failures rejected with 401 before
 * the WebSocket handshake completes.
 *
 * The TypedSocket exposed to handlers wraps each ws connection. Inbound frames
 * are JSON-parsed, Zod-validated, then dispatched to listeners registered via
 * `socket.on(event, fn)`. For `kind: 'request'` envelopes, the last argument
 * passed to listeners is a callback that, when invoked, sends back a matching
 * `kind: 'response'` envelope with the same id.
 *
 * Replay (seq + ring buffer) is intentionally NOT in this layer. It belongs in
 * a `ResumableSocket` wrapper applied above this transport so it composes with
 * any future Transport implementation.
 */
export class WsTransport implements Transport {
  private wss?: WebSocketServer;
  private upgradeHandler?: (
    req: IncomingMessage,
    socket: import('node:net').Socket,
    head: Buffer,
  ) => void;
  private readonly listeners = new Set<(socket: TypedSocket) => void>();
  private readonly meta = new WeakMap<WebSocket, SocketMeta>();
  /** Reverse lookup: given an adapter (TypedSocket), find its underlying ws. */
  private readonly adapterToWs = new WeakMap<TypedSocket, WebSocket>();
  /**
   * Persist the per-session outbound seq across reconnects. Without this, each
   * new ws connection restarts at 0, so a replay through a freshly-opened
   * adapter ships envelopes whose seq numbers overlap what the previous
   * connection already wrote — the client's `lastSeq` is then stale and the
   * next reconnect re-replays already-delivered events. Persisting by
   * sessionKey keeps the wire-level seq monotonic for the lifetime of a
   * logical session, matching what the client tracks via `env.seq`.
   */
  private readonly seqBySession = new Map<string, number>();

  constructor(private readonly opts: WsTransportOptions) {}

  attach(httpServer: HttpServer): TransportHandle {
    const path = this.opts.path ?? '/ws';
    // Use noServer mode so a single http.Server can host multiple endpoints
    // (e.g. socket.io on /socket.io and ws on /ws). `attach` would consume
    // every upgrade indiscriminately.
    const wss = new WebSocketServer({ noServer: true });
    this.wss = wss;

    const upgradeHandler = (
      req: IncomingMessage,
      socket: import('node:net').Socket,
      head: Buffer,
    ) => {
      if (req.url?.split('?')[0] !== path) return;
      this.handleUpgrade(req, socket, head, wss);
    };
    httpServer.on('upgrade', upgradeHandler);
    this.upgradeHandler = upgradeHandler;

    return {
      onConnection: (cb) => {
        this.listeners.add(cb);
        return () => this.listeners.delete(cb);
      },
      close: async () => {
        this.listeners.clear();
        if (this.upgradeHandler) {
          httpServer.off('upgrade', this.upgradeHandler);
          this.upgradeHandler = undefined;
        }
        if (this.wss) {
          for (const ws of this.wss.clients) ws.terminate();
          await new Promise<void>((resolve) => {
            this.wss?.close(() => resolve());
          });
          this.wss = undefined;
        }
      },
    };
  }

  private async handleUpgrade(
    req: IncomingMessage,
    socket: import('node:net').Socket,
    head: Buffer,
    wss: WebSocketServer,
  ): Promise<void> {
    let ctx: AuthContext | null = null;
    try {
      ctx = await this.opts.authenticator.authenticate(req);
    } catch (err) {
      logger.warn({ err }, 'ws authenticator threw');
    }
    if (!ctx) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    const sessionKey = extractSessionKey(req);
    wss.handleUpgrade(req, socket, head, (ws) => {
      this.acceptConnection(ws, ctx, sessionKey);
    });
  }

  /**
   * Look up the sessionKey associated with a TypedSocket previously emitted
   * by this transport. Returns undefined for non-ws sockets or if the client
   * didn't include `?sessionKey=` in the upgrade URL.
   */
  sessionKeyFor(socket: TypedSocket): string | undefined {
    const ws = this.adapterToWs.get(socket);
    if (!ws) return undefined;
    return this.meta.get(ws)?.sessionKey;
  }

  private acceptConnection(
    ws: WebSocket,
    authContext: AuthContext,
    sessionKey: string | undefined,
  ): void {
    const meta: SocketMeta = {
      authContext,
      // Resume outbound seq from where the prior connection on the same
      // sessionKey left off; this is what keeps the client's `lastSeq`
      // valid across reconnects.
      nextSeq: sessionKey ? (this.seqBySession.get(sessionKey) ?? 0) : 0,
      listeners: new Map(),
      lastSeen: Date.now(),
      sessionKey,
    };
    this.meta.set(ws, meta);

    const id = randomUUID();
    const adapter = this.makeAdapter(ws, id);
    this.adapterToWs.set(adapter, ws);

    const pingMs = this.opts.heartbeatIntervalMs ?? 25_000;
    const idleMs = this.opts.idleTimeoutMs ?? 60_000;
    meta.pingTimer = setInterval(() => {
      if (ws.readyState === ws.OPEN) ws.ping();
    }, pingMs);
    // Check idle at half the timeout (or 5 s, whichever is smaller) so we
    // detect silence within 1.5× idleMs at the latest.
    const idleCheckMs = Math.max(50, Math.min(idleMs / 2, 5_000));
    meta.idleTimer = setInterval(() => {
      if (Date.now() - meta.lastSeen > idleMs && ws.readyState === ws.OPEN) {
        ws.close(4000, 'idle');
      }
    }, idleCheckMs);

    const touch = () => {
      meta.lastSeen = Date.now();
    };

    ws.on('message', (raw) => {
      touch();
      this.handleMessage(ws, raw);
    });
    ws.on('pong', touch);
    ws.on('close', () => {
      if (meta.pingTimer) clearInterval(meta.pingTimer);
      if (meta.idleTimer) clearInterval(meta.idleTimer);
      this.fireLocalEvent(ws, 'disconnect');
      this.meta.delete(ws);
    });
    ws.on('error', (err) => {
      logger.warn({ err }, 'ws socket error');
    });

    for (const cb of this.listeners) {
      try {
        cb(adapter);
      } catch (err) {
        logger.warn({ err }, 'onConnection listener threw');
      }
    }
  }

  private makeAdapter(ws: WebSocket, id: string): TypedSocket {
    return {
      id,
      emit: (event: string, ...args: unknown[]) => {
        if (ws.readyState !== ws.OPEN) return;
        const meta = this.meta.get(ws);
        if (!meta) return;
        const seq = ++meta.nextSeq;
        if (meta.sessionKey) this.seqBySession.set(meta.sessionKey, seq);
        const env: Envelope = { kind: 'event', seq, event, data: args[0] };
        ws.send(JSON.stringify(env));
      },
      on: (event: string, listener: (...args: unknown[]) => void) => {
        const meta = this.meta.get(ws);
        if (!meta) return;
        let set = meta.listeners.get(event);
        if (!set) {
          set = new Set();
          meta.listeners.set(event, set);
        }
        set.add(listener);
      },
    };
  }

  private handleMessage(ws: WebSocket, raw: unknown): void {
    let parsed: unknown;
    try {
      parsed = JSON.parse(typeof raw === 'string' ? raw : (raw?.toString() ?? ''));
    } catch {
      logger.warn('ws received non-JSON frame; dropping');
      return;
    }

    const result = EnvelopeSchema.safeParse(parsed);
    if (!result.success) {
      logger.warn({ issues: result.error.issues }, 'ws envelope validation failed; dropping');
      return;
    }
    const env = result.data;

    switch (env.kind) {
      case 'ping':
        if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({ kind: 'pong' }));
        return;
      case 'pong':
        return;
      case 'resume':
        // Forward as a synthetic event; the upper layer (ResumableConnectionRegistry)
        // owns the actual replay logic.
        this.fireLocalEvent(ws, RESUME_EVENT, { lastSeq: env.lastSeq });
        return;
      case 'event':
        this.fireLocalEvent(ws, env.event, env.data);
        return;
      case 'request': {
        // Transparent ack: whatever the handler passes to `cb` becomes the
        // response envelope's `data`. cc-office handlers use mixed
        // conventions (raw payload like `cb({ projects })` vs RpcResult like
        // `cb(ok({ state }))`); both flow through unchanged, matching
        // socket.io ack semantics.
        const cb: SocketCallback = (result) => {
          if (ws.readyState !== ws.OPEN) return;
          const response: Envelope = { kind: 'response', id: env.id, ok: true, data: result };
          ws.send(JSON.stringify(response));
        };
        this.fireLocalEvent(ws, env.event, env.data, cb);
        return;
      }
      case 'response':
        // Server-side WsTransport does not currently issue requests, so an
        // unsolicited response is dropped. Future bidirectional RPC would
        // route this to a pending-request map.
        return;
    }
  }

  private fireLocalEvent(
    ws: WebSocket,
    event: string,
    payload?: unknown,
    cb?: SocketCallback,
  ): void {
    const meta = this.meta.get(ws);
    if (!meta) return;
    const set = meta.listeners.get(event);
    if (!set) return;
    for (const fn of set) {
      try {
        if (cb) fn(payload, cb);
        else if (payload !== undefined) fn(payload);
        else fn();
      } catch (err) {
        logger.warn({ err, event }, 'ws listener threw');
      }
    }
  }
}

function extractSessionKey(req: IncomingMessage): string | undefined {
  if (!req.url) return undefined;
  // req.url is the path+query — pair with a dummy host so URL can parse it.
  // URL constructor throws on certain malformed inputs (unpaired surrogates,
  // some control chars); a malicious / buggy client must not crash the
  // upgrade handler.
  let url: URL;
  try {
    url = new URL(req.url, 'http://localhost');
  } catch {
    return undefined;
  }
  const key = url.searchParams.get('sessionKey');
  return key && key.length > 0 ? key : undefined;
}
